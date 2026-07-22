import { requireEvidence } from './evidence-engine.js';
import { InvalidEntityError } from './errors.js';
import type {
  CompatibilityRelationshipId,
  CompatibilityRuleId,
  EvidenceId,
  ReleaseId,
  SnapshotId,
} from './ids.js';

export type CompatibilityStatus = 'compatible' | 'incompatible' | 'unverified';

/**
 * The computed statement that two releases are compatible, incompatible, or
 * unverified — the atomic unit the Compatibility Engine produces and the
 * Knowledge Graph stores as an edge (docs/architecture/domain-model.md#value-objects).
 */
export interface CompatibilityRelationship {
  readonly id: CompatibilityRelationshipId;
  readonly releaseAId: ReleaseId;
  readonly releaseBId: ReleaseId;
  readonly status: CompatibilityStatus;
  readonly ruleIds: readonly CompatibilityRuleId[];
  readonly evidenceIds: readonly EvidenceId[];
  readonly snapshotId: SnapshotId;
}

/**
 * Constructs a CompatibilityRelationship, enforcing ADR 0006: a status other
 * than "unverified" cannot be asserted without at least one Evidence
 * citation. This is the invariant made real, not just documented.
 */
export function createCompatibilityRelationship(input: {
  readonly id: CompatibilityRelationshipId;
  readonly releaseAId: ReleaseId;
  readonly releaseBId: ReleaseId;
  readonly status: CompatibilityStatus;
  readonly ruleIds: readonly CompatibilityRuleId[];
  readonly evidenceIds: readonly EvidenceId[];
  readonly snapshotId: SnapshotId;
}): CompatibilityRelationship {
  if (input.releaseAId === input.releaseBId) {
    throw new InvalidEntityError(
      `CompatibilityRelationship ${input.id} cannot compare release ${input.releaseAId} against itself.`,
    );
  }
  if (input.status !== 'unverified') {
    requireEvidence(input.evidenceIds, `CompatibilityRelationship ${input.id} (status "${input.status}")`);
  }
  return { ...input };
}
