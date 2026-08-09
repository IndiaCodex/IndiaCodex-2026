import {
  computeRisk,
  createCompatibilityRelationship,
  detectBreakingChanges,
  evaluateCompatibility,
  latestRelease,
  NotFoundError,
  providedCapabilities,
  toCompatibilityRelationshipId,
  toRiskId,
} from '@compass/domain';
import type {
  BreakingChangeCandidate,
  Component,
  ComponentId,
  Constraint,
  Release,
  ReleaseId,
  Risk,
  Snapshot,
  SnapshotId,
  VersionScheme,
} from '@compass/domain';
import type { IdGeneratorPort } from '../ports/id-generator.port.js';
import type { SnapshotRepositoryPort } from '../ports/snapshot-repository.port.js';

export interface AnalyzeBreakingChangeImpactQuery {
  readonly componentId: ComponentId;
  readonly fromSnapshotId: SnapshotId;
  readonly toSnapshotId: SnapshotId;
}

export interface ChangedConstraint {
  readonly targetComponentId: ComponentId;
  readonly from: Constraint | null;
  readonly to: Constraint | null;
}

export interface BreakingChangeImpactReport {
  readonly componentId: ComponentId;
  readonly fromReleaseId: ReleaseId;
  readonly toReleaseId: ReleaseId;
  readonly addedCapabilities: readonly string[];
  readonly removedCapabilities: readonly BreakingChangeCandidate[];
  readonly changedConstraints: readonly ChangedConstraint[];
  /** Components elsewhere in the "to" snapshot whose declared dependency the "to" release now violates. */
  readonly affectedComponentIds: readonly ComponentId[];
  /** Null when there are no known dependents at all — nothing to derive a Risk from (ADR 0006). */
  readonly risk: Risk | null;
}

/**
 * Compares the latest release of one component across two snapshots
 * (ADR 0007's versioned history is what makes "compare two points in time"
 * possible at all) and reports what changed and who it affects
 * (docs — "Breaking Change Analyzer"). Constructs transient
 * CompatibilityRelationship/Risk objects for the analysis; nothing here is
 * persisted back to either snapshot.
 */
export class AnalyzeBreakingChangeImpactUseCase {
  public constructor(
    private readonly snapshotRepository: SnapshotRepositoryPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly versionScheme: VersionScheme,
  ) {}

  public async execute(query: AnalyzeBreakingChangeImpactQuery): Promise<BreakingChangeImpactReport> {
    const fromSnapshot = await this.snapshotRepository.getById(query.fromSnapshotId);
    if (!fromSnapshot) throw new NotFoundError('Snapshot', query.fromSnapshotId);
    const toSnapshot = await this.snapshotRepository.getById(query.toSnapshotId);
    if (!toSnapshot) throw new NotFoundError('Snapshot', query.toSnapshotId);

    const fromRelease = latestRelease(fromSnapshot, query.componentId, this.versionScheme);
    if (!fromRelease) throw new NotFoundError('Release', `${query.componentId} in snapshot ${query.fromSnapshotId}`);
    const toRelease = latestRelease(toSnapshot, query.componentId, this.versionScheme);
    if (!toRelease) throw new NotFoundError('Release', `${query.componentId} in snapshot ${query.toSnapshotId}`);
    const toComponent = toSnapshot.components.find((component) => component.id === query.componentId);
    if (!toComponent) throw new NotFoundError('Component', query.componentId);

    const removedCapabilities = detectBreakingChanges(fromRelease, toRelease);
    const addedCapabilities = diffAddedCapabilityNames(fromRelease, toRelease);
    const changedConstraints = diffDependencyConstraints(fromRelease, toRelease);

    const { affectedComponentIds, relationships } = this.findAffectedComponents(toSnapshot, toComponent, toRelease);

    const risk =
      relationships.length === 0
        ? null
        : computeRisk({
            id: toRiskId(this.idGenerator.next('risk')),
            scope: { kind: 'component', componentId: query.componentId },
            relationships,
            breakingChanges: [],
            snapshotId: toSnapshot.id,
          });

    return {
      componentId: query.componentId,
      fromReleaseId: fromRelease.id,
      toReleaseId: toRelease.id,
      addedCapabilities,
      removedCapabilities,
      changedConstraints,
      affectedComponentIds,
      risk,
    };
  }

  private findAffectedComponents(
    snapshot: Snapshot,
    targetComponent: Component,
    targetRelease: Release,
  ): { affectedComponentIds: ComponentId[]; relationships: ReturnType<typeof createCompatibilityRelationship>[] } {
    const affectedComponentIds: ComponentId[] = [];
    const relationships: ReturnType<typeof createCompatibilityRelationship>[] = [];

    for (const dependentRelease of snapshot.releases) {
      const dependency = dependentRelease.dependencies.find((dep) => dep.targetComponentId === targetComponent.id);
      if (!dependency) continue;
      const dependentComponent = snapshot.components.find((component) => component.id === dependentRelease.componentId);
      if (!dependentComponent) continue;

      const evaluation = evaluateCompatibility({
        releaseA: dependentRelease,
        componentA: dependentComponent,
        releaseB: targetRelease,
        componentB: targetComponent,
        dependency,
        rules: snapshot.compatibilityRules,
        evidence: snapshot.evidence,
        versionScheme: this.versionScheme,
      });

      if (evaluation.status === 'incompatible') {
        affectedComponentIds.push(dependentComponent.id);
      }

      if (evaluation.evidenceIds.length > 0) {
        relationships.push(
          createCompatibilityRelationship({
            id: toCompatibilityRelationshipId(this.idGenerator.next('relationship')),
            releaseAId: dependentRelease.id,
            releaseBId: targetRelease.id,
            status: evaluation.status,
            ruleIds: evaluation.firedRules.map((fired) => fired.rule.id),
            evidenceIds: evaluation.evidenceIds,
            snapshotId: snapshot.id,
          }),
        );
      }
    }

    return { affectedComponentIds, relationships };
  }
}

function diffAddedCapabilityNames(fromRelease: Release, toRelease: Release): readonly string[] {
  const fromNames = new Set(providedCapabilities(fromRelease).map((capability) => capability.name));
  return providedCapabilities(toRelease)
    .map((capability) => capability.name)
    .filter((name) => !fromNames.has(name));
}

function diffDependencyConstraints(fromRelease: Release, toRelease: Release): readonly ChangedConstraint[] {
  const targets = new Set([
    ...fromRelease.dependencies.map((dep) => dep.targetComponentId),
    ...toRelease.dependencies.map((dep) => dep.targetComponentId),
  ]);

  const changed: ChangedConstraint[] = [];
  for (const targetComponentId of targets) {
    const from = fromRelease.dependencies.find((dep) => dep.targetComponentId === targetComponentId)?.constraint ?? null;
    const to = toRelease.dependencies.find((dep) => dep.targetComponentId === targetComponentId)?.constraint ?? null;
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changed.push({ targetComponentId, from, to });
    }
  }
  return changed;
}
