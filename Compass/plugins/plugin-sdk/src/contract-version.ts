/**
 * The plugin-sdk contract is versioned independently of everything else in
 * the workspace (docs/architecture/plugin-architecture.md#plugin-versioning):
 * a plugin declares which version of the Source Adapter / Capability
 * Extractor / Rule Pack contracts it was built against, so the core can
 * evolve the contract without silently breaking a plugin that hasn't been
 * updated. This is Compass applying its own compatibility discipline to
 * the one relationship it can't outsource to itself.
 */
export const PLUGIN_SDK_CONTRACT_VERSION = '1.0.0';

export interface PluginManifest {
  readonly name: string;
  /** The plugin-sdk contract version this plugin was built against, e.g. "1.0.0". */
  readonly contractVersion: string;
}

export class UnsupportedContractVersionError extends Error {
  public constructor(pluginName: string, declared: string, supported: string) {
    super(
      `Plugin "${pluginName}" declares plugin-sdk contract version "${declared}", which is not compatible with ` +
        `the supported contract version "${supported}" (major version must match).`,
    );
    this.name = 'UnsupportedContractVersionError';
  }
}

function majorVersion(version: string, label: string): string {
  const [major] = version.split('.');
  if (!major || !/^\d+$/.test(major)) {
    throw new TypeError(`"${version}" is not a valid ${label} — expected a semantic version like "1.0.0".`);
  }
  return major;
}

/**
 * Throws UnsupportedContractVersionError unless the plugin's declared
 * contract version shares the same major version as the contract this SDK
 * currently implements. Register plugins through this check at each
 * interface's composition root (docs/architecture/plugin-architecture.md#registration-is-explicit).
 */
export function assertContractVersionSupported(manifest: PluginManifest): void {
  const supportedMajor = majorVersion(PLUGIN_SDK_CONTRACT_VERSION, 'PLUGIN_SDK_CONTRACT_VERSION');
  const pluginMajor = majorVersion(manifest.contractVersion, `"${manifest.name}"'s declared contractVersion`);
  if (supportedMajor !== pluginMajor) {
    throw new UnsupportedContractVersionError(manifest.name, manifest.contractVersion, PLUGIN_SDK_CONTRACT_VERSION);
  }
}
