// Re-exported for plugin authors' convenience — the contract a plugin implements
// (docs/architecture/plugin-architecture.md#three-extension-points).
export type {
  CapabilityExtractionResult,
  CapabilityExtractorPort,
  DiscoveredRelease,
  IngestionContext,
  RulePackPort,
  SourceAdapterPort,
  SourceDiscoveryResult,
} from '@compass/application';

export * from './contract-version.js';
export * from './conformance.js';
