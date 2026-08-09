/**
 * Parses a real npm-style package.json manifest into the domain's
 * normalized Capability/Dependency vocabulary
 * (docs/architecture/plugin-architecture.md#capability-extractor). Only
 * fields every real package.json is guaranteed to have real, standard
 * meaning for are used:
 *
 *  - `name` + `version` become the release's own "provided" capability —
 *    what lets a dependent's declared dependency on this exact package
 *    name resolve onto it.
 *  - `dependencies` / `peerDependencies` become Dependency edges, but only
 *    toward components this plugin's registry also tracks (by declared
 *    `providedPackageName`) — a dependency on an untracked package like
 *    `chalk` is real data Compass has no opinion about, so it's left alone,
 *    not modeled as a stub.
 *  - `engines.node` becomes a Dependency on the synthetic Node.js runtime
 *    component — the single most common real "minimum supported runtime"
 *    signal in the ecosystem.
 *
 * Monorepo-internal ranges like `workspace:*` are not valid version
 * constraints outside that monorepo, so they're deterministically skipped
 * rather than guessed at — the same fail-closed discipline governing
 * every other conclusion in this engine.
 */
import { createEvidence, requiresCapability, semVerScheme, toComponentId, toEvidenceId, versionRange } from '@compass/domain';
import type { Capability, Dependency } from '@compass/domain';
import type {
  CapabilityExtractionResult,
  CapabilityExtractorPort,
  DiscoveredRelease,
  IngestionContext,
} from '@compass/plugin-sdk';
import { parseGitHubLocator } from './midnight-source-adapter.js';
import { NODE_COMPONENT } from './node-runtime.js';
import { MIDNIGHT_REPOSITORIES } from './registry.js';
import type { MidnightRepositoryConfig } from './registry.js';
import type { Artifact } from '@compass/domain';
import type { GitHubClient } from './github-client.js';

interface PackageManifest {
  readonly name?: string;
  readonly version?: string;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly engines?: { readonly node?: string };
}

function isParseableSemVerRange(range: string): boolean {
  try {
    semVerScheme.satisfies({ scheme: 'semver', raw: '0.0.0' }, range);
    return true;
  } catch {
    return false;
  }
}

function findConfigByComponentId(
  registry: readonly MidnightRepositoryConfig[],
  componentId: string,
): MidnightRepositoryConfig | undefined {
  return registry.find((config) => `${config.owner}/${config.repo}` === componentId);
}

export class NpmManifestCapabilityExtractor implements CapabilityExtractorPort {
  public readonly name = 'npm-manifest-capability-extractor';

  public constructor(
    private readonly client: GitHubClient,
    private readonly registry: readonly MidnightRepositoryConfig[] = MIDNIGHT_REPOSITORIES,
  ) {}

  public async extract(
    release: DiscoveredRelease,
    artifacts: readonly Artifact[],
    context: IngestionContext,
  ): Promise<CapabilityExtractionResult> {
    const empty: CapabilityExtractionResult = { releaseId: release.id, capabilities: [], dependencies: [], evidence: [] };

    const config = findConfigByComponentId(this.registry, release.componentId);
    if (config?.extractorKind !== 'npm-manifest' || !config.manifestPath) return empty;

    const locatorArtifact = artifacts.find((artifact) => parseGitHubLocator(artifact.locator));
    const located = locatorArtifact ? parseGitHubLocator(locatorArtifact.locator) : null;
    if (!located) return empty;

    const manifestContent = await this.client.getFileContent(located.owner, located.repo, config.manifestPath, located.ref);
    if (!manifestContent) return empty;

    const manifest = JSON.parse(manifestContent) as PackageManifest;
    if (!manifest.name || !manifest.version) return empty;

    const capabilities: Capability[] = [
      { name: manifest.name, version: semVerScheme.parse(manifest.version), direction: 'provided' },
    ];
    if (release.version.raw.includes('-')) {
      // A prerelease identifier is present (alpha/beta/rc) — see prerelease-advisory in the rule pack.
      capabilities.push({ name: 'prerelease', version: release.version, direction: 'provided' });
    }

    const dependencies: Dependency[] = [];
    const declaredDependencies = { ...manifest.dependencies, ...manifest.peerDependencies };
    for (const [packageName, range] of Object.entries(declaredDependencies)) {
      if (!isParseableSemVerRange(range)) continue; // e.g. "workspace:*" — not a real cross-repo constraint
      const targetConfig = this.registry.find((candidate) => candidate.providedPackageName === packageName);
      if (!targetConfig) continue; // a real dependency Compass simply isn't tracking the other side of
      dependencies.push({
        targetComponentId: toComponentId(`${targetConfig.owner}/${targetConfig.repo}`),
        constraint: versionRange(range),
        kind: manifest.peerDependencies?.[packageName] ? 'peer' : 'required',
      });
    }

    if (manifest.engines?.node && isParseableSemVerRange(manifest.engines.node)) {
      dependencies.push({
        targetComponentId: NODE_COMPONENT.id,
        constraint: versionRange(manifest.engines.node),
        kind: 'required',
      });
    }

    const evidence = [
      createEvidence({
        id: toEvidenceId(`e-manifest-${located.owner}-${located.repo}-${located.ref}`),
        subject: { kind: 'release', id: release.id },
        sourceType: 'declared-metadata',
        producedBy: this.name,
        payload: { path: config.manifestPath, ref: located.ref, packageName: manifest.name, version: manifest.version },
        collectedAt: context.collectedAt,
        snapshotId: context.snapshotId,
      }),
    ];

    if (config.contractPath) {
      const contractDependency = await this.extractContractLanguageDependency(config, located.ref, release, context);
      if (contractDependency) {
        dependencies.push(contractDependency.dependency);
        evidence.push(contractDependency.evidence);
      }
    }

    return { releaseId: release.id, capabilities, dependencies, evidence };
  }

  private async extractContractLanguageDependency(
    config: MidnightRepositoryConfig,
    ref: string,
    release: DiscoveredRelease,
    context: IngestionContext,
  ): Promise<{ dependency: Dependency; evidence: ReturnType<typeof createEvidence> } | null> {
    if (!config.contractPath) return null;
    const contractSource = await this.client.getFileContent(config.owner, config.repo, config.contractPath, ref);
    if (!contractSource) return null;

    const match = /pragma\s+language_version\s*(>=|<=|>|<|=)?\s*([\d.]+)\s*;/.exec(contractSource);
    if (!match) return null;
    const [, operator, versionText] = match;
    const range = `${operator ?? '>='}${versionText}`;

    const compactConfig = this.registry.find((candidate) => candidate.extractorKind === 'compact-toolchain-release');
    if (!compactConfig) return null;

    return {
      dependency: {
        targetComponentId: toComponentId(`${compactConfig.owner}/${compactConfig.repo}`),
        constraint: requiresCapability('compact-language', range),
        kind: 'required',
      },
      evidence: createEvidence({
        id: toEvidenceId(`e-pragma-${config.owner}-${config.repo}-${ref}`),
        subject: { kind: 'release', id: release.id },
        sourceType: 'declared-metadata',
        producedBy: this.name,
        payload: { contractPath: config.contractPath, pragma: match[0].trim() },
        collectedAt: context.collectedAt,
        snapshotId: context.snapshotId,
      }),
    };
  }
}
