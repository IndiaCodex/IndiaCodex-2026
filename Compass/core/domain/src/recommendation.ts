import { InvalidEntityError, UnsubstantiatedRecommendationError } from './errors.js';
import type { ComponentId, EvidenceId, CompatibilityRelationshipId, RecommendationId, ReleaseId, RiskId, SnapshotId } from './ids.js';

export type RecommendationAction = 'upgrade' | 'avoid' | 'hold' | 'investigate-further';

export type RecommendationRationale =
  | { readonly kind: 'evidence'; readonly id: EvidenceId }
  | { readonly kind: 'compatibility-relationship'; readonly id: CompatibilityRelationshipId }
  | { readonly kind: 'risk'; readonly id: RiskId };

/** An actionable, derived suggestion — the output the Upgrade Advisor ultimately hands to a consumer. */
export interface Recommendation {
  readonly id: RecommendationId;
  readonly subjectComponentId: ComponentId;
  readonly action: RecommendationAction;
  readonly targetReleaseId: ReleaseId | null;
  readonly rationale: readonly RecommendationRationale[];
  readonly snapshotId: SnapshotId;
}

/**
 * Constructs a Recommendation, enforcing invariant #5: it cannot exist
 * without rationale pointing to the data it was derived from, and an
 * "upgrade" action must name the release it recommends upgrading to.
 */
export function createRecommendation(input: {
  readonly id: RecommendationId;
  readonly subjectComponentId: ComponentId;
  readonly action: RecommendationAction;
  readonly targetReleaseId: ReleaseId | null;
  readonly rationale: readonly RecommendationRationale[];
  readonly snapshotId: SnapshotId;
}): Recommendation {
  if (input.rationale.length === 0) {
    throw new UnsubstantiatedRecommendationError(
      `Recommendation ${input.id} has no rationale; a Recommendation must cite at least one Evidence, ` +
        'CompatibilityRelationship, or Risk it was derived from.',
    );
  }
  if (input.action === 'upgrade' && input.targetReleaseId === null) {
    throw new InvalidEntityError(`Recommendation ${input.id}: an "upgrade" action must specify a targetReleaseId.`);
  }
  return { ...input };
}
