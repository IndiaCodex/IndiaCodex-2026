import type { Version } from './version.js';

/**
 * Whether a Capability is offered by a release, or required by it of
 * something else it depends on (docs/architecture/domain-model.md#value-objects).
 */
export type CapabilityDirection = 'provided' | 'required';

/**
 * A named, versioned feature a release provides or requires — what lets
 * compatibility reasoning go beyond raw version numbers.
 */
export interface Capability {
  readonly name: string;
  readonly version: Version;
  readonly direction: CapabilityDirection;
}
