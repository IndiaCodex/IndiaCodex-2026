import type { Artifact, Component, ComponentId, Evidence, ReleaseId, Repository, Timestamp, Version } from '@compass/domain';
import type { IngestionContext } from './ingestion-context.js';

/**
 * A release as discovered by a Source Adapter, before Capability
 * Extraction has run — it carries its own metadata and artifacts, but not
 * yet the Capabilities/Dependencies a CapabilityExtractorPort derives from
 * manifest parsing (docs/architecture/plugin-architecture.md#source-adapter).
 */
export interface DiscoveredRelease {
  readonly id: ReleaseId;
  readonly componentId: ComponentId;
  readonly version: Version;
  readonly publishedAt: Timestamp;
  readonly artifacts: readonly Artifact[];
}

export interface SourceDiscoveryResult {
  readonly repositories: readonly Repository[];
  readonly components: readonly Component[];
  readonly releases: readonly DiscoveredRelease[];
  readonly evidence: readonly Evidence[];
}

/**
 * Discovers what exists in an ecosystem source. A Source Adapter asserts
 * facts and their Evidence; it does not decide what's compatible
 * (docs/architecture/plugin-architecture.md#source-adapter).
 */
export interface SourceAdapterPort {
  readonly name: string;
  discover(context: IngestionContext): Promise<SourceDiscoveryResult>;
}
