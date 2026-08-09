import type { Artifact, Capability, Dependency, Evidence, ReleaseId } from '@compass/domain';
import type { IngestionContext } from './ingestion-context.js';
import type { DiscoveredRelease } from './source-adapter.port.js';

export interface CapabilityExtractionResult {
  readonly releaseId: ReleaseId;
  readonly capabilities: readonly Capability[];
  readonly dependencies: readonly Dependency[];
  readonly evidence: readonly Evidence[];
}

/**
 * Parses ecosystem-specific artifact metadata into the domain's normalized
 * Capability/Dependency vocabulary (docs/architecture/plugin-architecture.md#capability-extractor).
 * Nothing downstream of this ever needs to know what a manifest looked like.
 */
export interface CapabilityExtractorPort {
  readonly name: string;
  extract(
    release: DiscoveredRelease,
    artifacts: readonly Artifact[],
    context: IngestionContext,
  ): Promise<CapabilityExtractionResult>;
}
