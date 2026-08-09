import {
  computeRisk,
  createCompatibilityRelationship,
  evaluateCompatibility,
  generateRecommendation,
  NotFoundError,
  toCompatibilityRelationshipId,
  toRecommendationId,
  toRiskId,
} from '@compass/domain';
import type { ComponentId, CompatibilityRelationship, Recommendation, ReleaseId, Risk, Snapshot, VersionScheme } from '@compass/domain';
import { EmptyStackError } from '../errors.js';
import type { IdGeneratorPort } from '../ports/id-generator.port.js';
import type { SnapshotRepositoryPort } from '../ports/snapshot-repository.port.js';

export interface EvaluateUpgradeQuery {
  readonly subjectComponentId: ComponentId;
  /** The releases currently in use, elsewhere in the stack, that the target might need to stay compatible with. */
  readonly currentStackReleaseIds: readonly ReleaseId[];
  readonly targetReleaseId: ReleaseId;
}

export interface UpgradeEvaluation {
  readonly recommendation: Recommendation;
  readonly risk: Risk;
}

/** Serves the Upgrade Advisor query (docs/architecture/api-contracts.md#upgrade-advisor). */
export class EvaluateUpgradeUseCase {
  public constructor(
    private readonly snapshotRepository: SnapshotRepositoryPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly versionScheme: VersionScheme,
  ) {}

  public async execute(query: EvaluateUpgradeQuery): Promise<UpgradeEvaluation> {
    const snapshot = await this.snapshotRepository.getLatest();
    if (!snapshot) {
      throw new NotFoundError('Snapshot', '(latest)');
    }

    const targetRelease = snapshot.releases.find((release) => release.id === query.targetReleaseId);
    if (!targetRelease) throw new NotFoundError('Release', query.targetReleaseId);
    const targetComponent = snapshot.components.find((component) => component.id === targetRelease.componentId);
    if (!targetComponent) throw new NotFoundError('Component', targetRelease.componentId);

    if (query.currentStackReleaseIds.length === 0) {
      throw new EmptyStackError(
        'EvaluateUpgradeUseCase requires at least one currentStackReleaseIds entry to evaluate the target ' +
          'against — there is no compatibility question to answer against an empty stack.',
      );
    }

    const stackReleases = query.currentStackReleaseIds
      .map((id) => snapshot.releases.find((release) => release.id === id))
      .filter((release): release is Snapshot['releases'][number] => release !== undefined);

    if (stackReleases.length === 0) {
      throw new NotFoundError('Release', query.currentStackReleaseIds.join(', '));
    }

    // Evaluate the target against every other release currently in the stack; the overall
    // relationship used for the recommendation is the worst one found — a single incompatible
    // neighbor makes the upgrade unsafe regardless of how many others are fine with it.
    const relationships = stackReleases.map((stackRelease) => {
      const stackComponent = snapshot.components.find((component) => component.id === stackRelease.componentId);
      if (!stackComponent) throw new NotFoundError('Component', stackRelease.componentId);
      const dependency = stackRelease.dependencies.find((dep) => dep.targetComponentId === targetComponent.id) ?? null;
      const evaluation = evaluateCompatibility({
        releaseA: stackRelease,
        componentA: stackComponent,
        releaseB: targetRelease,
        componentB: targetComponent,
        dependency,
        rules: snapshot.compatibilityRules,
        evidence: snapshot.evidence,
        versionScheme: this.versionScheme,
      });
      return createCompatibilityRelationship({
        id: toCompatibilityRelationshipId(this.idGenerator.next('relationship')),
        releaseAId: stackRelease.id,
        releaseBId: targetRelease.id,
        status: evaluation.status,
        ruleIds: evaluation.firedRules.map((fired) => fired.rule.id),
        evidenceIds: evaluation.evidenceIds,
        snapshotId: snapshot.id,
      });
    });

    // relationships is non-empty here: stackReleases.length > 0 is guaranteed above, and every
    // stack release produces exactly one relationship against the target. worstRelationship
    // only returns undefined for an empty input, which this call site never passes.
    const overallRelationship = assertDefined(
      worstRelationship(relationships),
      'worstRelationship received an empty array despite stackReleases being non-empty',
    );

    const risk = computeRisk({
      id: toRiskId(this.idGenerator.next('risk')),
      scope: { kind: 'component', componentId: query.subjectComponentId },
      relationships,
      breakingChanges: snapshot.breakingChanges.filter(
        (change) => change.componentId === targetComponent.id && change.toReleaseId === targetRelease.id,
      ),
      snapshotId: snapshot.id,
    });

    const recommendation = generateRecommendation({
      id: toRecommendationId(this.idGenerator.next('recommendation')),
      subjectComponentId: query.subjectComponentId,
      targetRelease,
      relationship: overallRelationship,
      risk,
      snapshotId: snapshot.id,
    });

    return { recommendation, risk };
  }
}

function worstRelationship(
  relationships: readonly CompatibilityRelationship[],
): CompatibilityRelationship | undefined {
  const incompatible = relationships.find((relationship) => relationship.status === 'incompatible');
  if (incompatible) return incompatible;
  const unverified = relationships.find((relationship) => relationship.status === 'unverified');
  if (unverified) return unverified;
  return relationships[0];
}

function assertDefined<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(`Internal invariant violated: ${message}`);
  }
  return value;
}
