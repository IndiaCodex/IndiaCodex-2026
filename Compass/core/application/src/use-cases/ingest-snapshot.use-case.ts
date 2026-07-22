import {
  computeRisk,
  createBreakingChange,
  createCompatibilityRelationship,
  createEvidence,
  detectBreakingChanges,
  evaluateCompatibility,
  latestRelease as findLatestRelease,
  NotFoundError,
  toBreakingChangeId,
  toCompatibilityRelationshipId,
  toEvidenceId,
  toRiskId,
  toSnapshotId,
} from '@compass/domain';
import type {
  Artifact,
  BreakingChange,
  Component,
  ComponentId,
  CompatibilityRelationship,
  CompatibilityRule,
  Dependency,
  Evidence,
  Release,
  Risk,
  Snapshot,
  VersionScheme,
} from '@compass/domain';
import type { ClockPort } from '../ports/clock.port.js';
import type { IdGeneratorPort } from '../ports/id-generator.port.js';
import type { CapabilityExtractorPort } from '../ports/capability-extractor.port.js';
import type { RulePackPort } from '../ports/rule-pack.port.js';
import type { SnapshotRepositoryPort } from '../ports/snapshot-repository.port.js';
import type { SourceAdapterPort } from '../ports/source-adapter.port.js';

export interface IngestSnapshotDependencies {
  readonly sourceAdapters: readonly SourceAdapterPort[];
  readonly capabilityExtractors: readonly CapabilityExtractorPort[];
  readonly rulePacks: readonly RulePackPort[];
  readonly snapshotRepository: SnapshotRepositoryPort;
  readonly clock: ClockPort;
  readonly idGenerator: IdGeneratorPort;
  readonly versionScheme: VersionScheme;
}

function mustFindComponent(components: readonly Component[], id: ComponentId): Component {
  const found = components.find((component) => component.id === id);
  if (!found) throw new NotFoundError('Component', id);
  return found;
}

/**
 * Ingests fresh ecosystem data through every registered plugin and produces
 * a new, immutable Knowledge Graph Snapshot (ADR 0007): discovery, then
 * capability/dependency extraction, then rule evaluation across every
 * declared dependency edge, then breaking-change detection against the
 * previous snapshot, then per-component risk. Nothing here knows which
 * ecosystem it's running against — every fact comes from the injected
 * plugins (docs/architecture/plugin-architecture.md).
 */
export class IngestSnapshotUseCase {
  public constructor(private readonly deps: IngestSnapshotDependencies) {}

  public async execute(): Promise<Snapshot> {
    const snapshotId = toSnapshotId(this.deps.idGenerator.next('snapshot'));
    const createdAt = this.deps.clock.now();
    const previousSnapshot = await this.deps.snapshotRepository.getLatest();
    const context = { snapshotId, collectedAt: createdAt };

    const discoveries = await Promise.all(this.deps.sourceAdapters.map(async (adapter) => adapter.discover(context)));
    const repositories = discoveries.flatMap((discovery) => discovery.repositories);
    const components = discoveries.flatMap((discovery) => discovery.components);
    const discoveredReleases = discoveries.flatMap((discovery) => discovery.releases);
    const artifacts: Artifact[] = discoveredReleases.flatMap((release) => release.artifacts);
    let evidence: Evidence[] = discoveries.flatMap((discovery) => discovery.evidence);

    const releases: Release[] = [];
    for (const discovered of discoveredReleases) {
      const extractionResults = await Promise.all(
        this.deps.capabilityExtractors.map(async (extractor) =>
          extractor.extract(discovered, discovered.artifacts, context),
        ),
      );
      const capabilities = extractionResults.flatMap((result) => result.capabilities);
      const dependencies: Dependency[] = extractionResults.flatMap((result) => result.dependencies);
      evidence = evidence.concat(extractionResults.flatMap((result) => result.evidence));

      releases.push({
        id: discovered.id,
        componentId: discovered.componentId,
        version: discovered.version,
        publishedAt: discovered.publishedAt,
        artifactIds: discovered.artifacts.map((artifact) => artifact.id),
        dependencies,
        capabilities,
      });
    }

    const rules: CompatibilityRule[] = this.deps.rulePacks.flatMap((pack) => pack.rules());

    const relationships = this.evaluateAllDependencyEdges({ releases, components, rules, evidence, snapshotId });
    const breakingChanges = this.detectAllBreakingChanges({
      releases,
      previousSnapshot,
      evidence,
      snapshotId,
      createdAt,
    });
    evidence = evidence.concat(breakingChanges.newEvidence);

    const risks = this.computeAllComponentRisks({
      components,
      releases,
      relationships,
      breakingChanges: breakingChanges.changes,
      snapshotId,
    });

    const snapshot: Snapshot = {
      id: snapshotId,
      createdAt,
      repositories,
      components,
      releases,
      artifacts,
      evidence,
      compatibilityRules: rules,
      compatibilityRelationships: relationships,
      breakingChanges: breakingChanges.changes,
      risks,
      recommendations: [],
    };

    await this.deps.snapshotRepository.save(snapshot);
    return snapshot;
  }

  private evaluateAllDependencyEdges(input: {
    releases: readonly Release[];
    components: readonly Component[];
    rules: readonly CompatibilityRule[];
    evidence: readonly Evidence[];
    snapshotId: Snapshot['id'];
  }): CompatibilityRelationship[] {
    const relationships: CompatibilityRelationship[] = [];

    for (const releaseA of input.releases) {
      const componentA = mustFindComponent(input.components, releaseA.componentId);
      for (const dependency of releaseA.dependencies) {
        const targetReleases = input.releases.filter(
          (candidate) => candidate.componentId === dependency.targetComponentId,
        );
        for (const releaseB of targetReleases) {
          const componentB = mustFindComponent(input.components, releaseB.componentId);
          const evaluation = evaluateCompatibility({
            releaseA,
            componentA,
            releaseB,
            componentB,
            dependency,
            rules: input.rules,
            evidence: input.evidence,
            versionScheme: this.deps.versionScheme,
          });

          relationships.push(
            createCompatibilityRelationship({
              id: toCompatibilityRelationshipId(this.deps.idGenerator.next('relationship')),
              releaseAId: releaseA.id,
              releaseBId: releaseB.id,
              status: evaluation.status,
              ruleIds: evaluation.firedRules.map((fired) => fired.rule.id),
              evidenceIds: evaluation.evidenceIds,
              snapshotId: input.snapshotId,
            }),
          );
        }
      }
    }

    return relationships;
  }

  private detectAllBreakingChanges(input: {
    releases: readonly Release[];
    previousSnapshot: Snapshot | null;
    evidence: readonly Evidence[];
    snapshotId: Snapshot['id'];
    createdAt: Snapshot['createdAt'];
  }): { changes: BreakingChange[]; newEvidence: Evidence[] } {
    const changes: BreakingChange[] = [];
    const newEvidence: Evidence[] = [];
    if (!input.previousSnapshot) {
      return { changes, newEvidence };
    }

    const componentIds = new Set(input.releases.map((release) => release.componentId));
    for (const componentId of componentIds) {
      const previousRelease = findLatestRelease(input.previousSnapshot, componentId, this.deps.versionScheme);
      if (!previousRelease) continue;

      const currentRelease = input.releases
        .filter((release) => release.componentId === componentId)
        .reduce<Release | undefined>((latest, candidate) => {
          if (!latest) return candidate;
          return this.deps.versionScheme.compare(candidate.version, latest.version) > 0 ? candidate : latest;
        }, undefined);
      if (!currentRelease || currentRelease.id === previousRelease.id) continue;

      const candidates = detectBreakingChanges(previousRelease, currentRelease);
      for (const candidate of candidates) {
        const evidenceRecord = createEvidence({
          id: toEvidenceId(this.deps.idGenerator.next('evidence')),
          subject: { kind: 'release', id: candidate.toReleaseId },
          sourceType: 'declared-metadata',
          producedBy: 'ingest-snapshot-use-case:breaking-change-detection',
          payload: { affectedCapability: candidate.affectedCapability },
          collectedAt: input.createdAt,
          snapshotId: input.snapshotId,
        });
        newEvidence.push(evidenceRecord);

        changes.push(
          createBreakingChange({
            id: toBreakingChangeId(this.deps.idGenerator.next('breaking-change')),
            fromRelease: previousRelease,
            toRelease: currentRelease,
            affectedCapability: candidate.affectedCapability,
            description: candidate.description,
            detectedViaEvidenceId: evidenceRecord.id,
          }),
        );
      }
    }

    return { changes, newEvidence };
  }

  private computeAllComponentRisks(input: {
    components: readonly Component[];
    releases: readonly Release[];
    relationships: readonly CompatibilityRelationship[];
    breakingChanges: readonly BreakingChange[];
    snapshotId: Snapshot['id'];
  }): Risk[] {
    const risks: Risk[] = [];
    for (const component of input.components) {
      const releaseIds = new Set(
        input.releases.filter((release) => release.componentId === component.id).map((release) => release.id),
      );
      const relevantRelationships = input.relationships.filter(
        (relationship) => releaseIds.has(relationship.releaseAId) || releaseIds.has(relationship.releaseBId),
      );
      const relevantBreakingChanges = input.breakingChanges.filter((change) => change.componentId === component.id);

      if (relevantRelationships.length === 0 && relevantBreakingChanges.length === 0) {
        continue;
      }

      risks.push(
        computeRisk({
          id: toRiskId(this.deps.idGenerator.next('risk')),
          scope: { kind: 'component', componentId: component.id },
          relationships: relevantRelationships,
          breakingChanges: relevantBreakingChanges,
          snapshotId: input.snapshotId,
        }),
      );
    }
    return risks;
  }
}
