import type { ArtifactId, ComponentId, ReleaseId, Timestamp } from './ids.js';
import type { Capability } from './capability.js';
import type { Dependency } from './dependency.js';
import type { Version } from './version.js';

/**
 * A specific published version of a Component. Immutable once constructed —
 * a correction is new Evidence recorded going forward, never a mutation of
 * a Release already ingested into a Snapshot (docs/architecture/domain-model.md#invariants).
 */
export interface Release {
  readonly id: ReleaseId;
  readonly componentId: ComponentId;
  readonly version: Version;
  readonly publishedAt: Timestamp;
  readonly artifactIds: readonly ArtifactId[];
  readonly dependencies: readonly Dependency[];
  readonly capabilities: readonly Capability[];
}

export function providedCapabilities(release: Release): readonly Capability[] {
  return release.capabilities.filter((capability) => capability.direction === 'provided');
}

export function requiredCapabilities(release: Release): readonly Capability[] {
  return release.capabilities.filter((capability) => capability.direction === 'required');
}
