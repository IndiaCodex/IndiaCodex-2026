import { CrossComponentBreakingChangeError } from './errors.js';
import { providedCapabilities } from './release.js';
import type { Release } from './release.js';
import type { ComponentId, ReleaseId } from './ids.js';

/**
 * A detected breaking change, not yet assigned an id or Evidence — those
 * are orchestration concerns (see @compass/application's ingest use case),
 * kept out of this pure function so it stays trivially unit-testable.
 */
export interface BreakingChangeCandidate {
  readonly componentId: ComponentId;
  readonly fromReleaseId: ReleaseId;
  readonly toReleaseId: ReleaseId;
  readonly affectedCapability: string;
  readonly description: string;
}

/**
 * Compares the capabilities two releases of the same component provide.
 * A capability present in `previous` but absent from `next` is reported as
 * a breaking change candidate. Deterministic and pure: no I/O, no clock, no
 * randomness — the same two releases always produce the same candidates.
 */
export function detectBreakingChanges(previous: Release, next: Release): readonly BreakingChangeCandidate[] {
  if (previous.componentId !== next.componentId) {
    throw new CrossComponentBreakingChangeError();
  }

  const nextProvidedNames = new Set(providedCapabilities(next).map((capability) => capability.name));

  return providedCapabilities(previous)
    .filter((capability) => !nextProvidedNames.has(capability.name))
    .map((capability) => ({
      componentId: previous.componentId,
      fromReleaseId: previous.id,
      toReleaseId: next.id,
      affectedCapability: capability.name,
      description:
        `Capability "${capability.name}" (${capability.version.raw}), provided by release ${previous.id}, ` +
        `is no longer provided by release ${next.id}.`,
    }));
}
