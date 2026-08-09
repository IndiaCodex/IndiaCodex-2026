import { CrossComponentBreakingChangeError, InvalidEntityError } from './errors.js';
import type { Release } from './release.js';
import type { BreakingChangeId, ComponentId, EvidenceId, ReleaseId } from './ids.js';

/** A specific, identified change between two releases of the *same* component. */
export interface BreakingChange {
  readonly id: BreakingChangeId;
  readonly componentId: ComponentId;
  readonly fromReleaseId: ReleaseId;
  readonly toReleaseId: ReleaseId;
  readonly affectedCapability: string | null;
  readonly description: string;
  readonly detectedViaEvidenceId: EvidenceId;
}

/**
 * Constructs a BreakingChange, enforcing invariant #4
 * (docs/architecture/domain-model.md#invariants): it must span two releases
 * of the same Component, never mix components.
 */
export function createBreakingChange(input: {
  readonly id: BreakingChangeId;
  readonly fromRelease: Release;
  readonly toRelease: Release;
  readonly affectedCapability: string | null;
  readonly description: string;
  readonly detectedViaEvidenceId: EvidenceId;
}): BreakingChange {
  if (input.fromRelease.componentId !== input.toRelease.componentId) {
    throw new CrossComponentBreakingChangeError();
  }
  if (input.fromRelease.id === input.toRelease.id) {
    throw new InvalidEntityError(`BreakingChange ${input.id}: fromRelease and toRelease must be different releases.`);
  }
  return {
    id: input.id,
    componentId: input.fromRelease.componentId,
    fromReleaseId: input.fromRelease.id,
    toReleaseId: input.toRelease.id,
    affectedCapability: input.affectedCapability,
    description: input.description,
    detectedViaEvidenceId: input.detectedViaEvidenceId,
  };
}
