import { UnsubstantiatedRiskError } from './errors.js';
import type { BreakingChangeId, ComponentId, CompatibilityRelationshipId, RepositoryId, ReleaseId, RiskId, SnapshotId } from './ids.js';

export type RiskLevel = 'low' | 'medium' | 'high';

export type RiskScope =
  | { readonly kind: 'component'; readonly componentId: ComponentId }
  | { readonly kind: 'repository'; readonly repositoryId: RepositoryId }
  | { readonly kind: 'declared-stack'; readonly releaseIds: readonly ReleaseId[] };

export type RiskContributingFactor =
  | { readonly kind: 'compatibility-relationship'; readonly id: CompatibilityRelationshipId }
  | { readonly kind: 'breaking-change'; readonly id: BreakingChangeId };

/** A derived signal summarizing unresolved incompatibility or staleness exposure. Always computed, never authored directly. */
export interface Risk {
  readonly id: RiskId;
  readonly scope: RiskScope;
  readonly level: RiskLevel;
  readonly contributingFactors: readonly RiskContributingFactor[];
  readonly snapshotId: SnapshotId;
}

/**
 * Constructs a Risk, enforcing invariant #5
 * (docs/architecture/domain-model.md#invariants): a Risk cannot exist
 * without at least one Compatibility Relationship or Breaking Change it was
 * actually computed from.
 */
export function createRisk(input: {
  readonly id: RiskId;
  readonly scope: RiskScope;
  readonly level: RiskLevel;
  readonly contributingFactors: readonly RiskContributingFactor[];
  readonly snapshotId: SnapshotId;
}): Risk {
  if (input.contributingFactors.length === 0) {
    throw new UnsubstantiatedRiskError(
      `Risk ${input.id} has no contributing factors; a Risk must be derived from at least one ` +
        'CompatibilityRelationship or BreakingChange.',
    );
  }
  return { ...input };
}
