/**
 * Discovers what exists across the real, tracked Midnight ecosystem
 * repositories (docs/architecture/plugin-architecture.md#source-adapter):
 * repositories, components (per the registry's declared type), and
 * releases with their published dates and version numbers. Asserts facts
 * and their Evidence; never decides what's compatible with what.
 *
 * The engine this feeds never imports this module or knows Midnight
 * exists — see @compass/domain and @compass/application, which only ever
 * see the generic Repository/Component/Release/Artifact/Evidence shapes
 * this adapter produces.
 */
import { createEvidence, semVerScheme, toArtifactId, toComponentId, toEvidenceId, toRepositoryId, toReleaseId, toTimestamp } from '@compass/domain';
import type { Artifact, ArtifactType, Component, Evidence, Repository } from '@compass/domain';
import type { DiscoveredRelease, IngestionContext, SourceAdapterPort, SourceDiscoveryResult } from '@compass/plugin-sdk';
import { NODE_COMPONENT, NODE_RELEASE_VERSIONS, NODE_REPOSITORY } from './node-runtime.js';
import { MIDNIGHT_REPOSITORIES } from './registry.js';
import type { MidnightRepositoryConfig } from './registry.js';
import type { GitHubClient } from './github-client.js';

/** Encodes where an artifact's content lives so a Capability Extractor can fetch it. Parsed by `parseGitHubLocator`. */
export function githubLocator(owner: string, repo: string, ref: string): string {
  return `github:${owner}/${repo}@${ref}`;
}

export function parseGitHubLocator(locator: string): { owner: string; repo: string; ref: string } | null {
  const match = /^github:([^/]+)\/([^@]+)@(.+)$/.exec(locator);
  if (!match) return null;
  const [, owner, repo, ref] = match;
  if (!owner || !repo || !ref) return null;
  return { owner, repo, ref };
}

function artifactTypeFor(config: MidnightRepositoryConfig): ArtifactType {
  if (config.extractorKind === 'npm-manifest') return 'package';
  if (config.extractorKind === 'compact-toolchain-release') return 'binary';
  return config.componentType === 'documentation' ? 'documentation' : 'other';
}

export class MidnightSourceAdapter implements SourceAdapterPort {
  public readonly name = 'midnight-source-adapter';

  public constructor(
    private readonly client: GitHubClient,
    private readonly registry: readonly MidnightRepositoryConfig[] = MIDNIGHT_REPOSITORIES,
  ) {}

  public async discover(context: IngestionContext): Promise<SourceDiscoveryResult> {
    const repositories: Repository[] = [NODE_REPOSITORY];
    const components: Component[] = [NODE_COMPONENT];
    const releases: DiscoveredRelease[] = [];
    const evidence: Evidence[] = [];

    for (const nodeVersion of NODE_RELEASE_VERSIONS) {
      const release = {
        id: toReleaseId(`nodejs/node@${nodeVersion}`),
        componentId: NODE_COMPONENT.id,
        version: semVerScheme.parse(nodeVersion),
        publishedAt: context.collectedAt,
        artifacts: [],
      };
      releases.push(release);
      evidence.push(
        createEvidence({
          id: toEvidenceId(`e-node-${nodeVersion}`),
          subject: { kind: 'release', id: release.id },
          sourceType: 'declared-metadata',
          producedBy: 'midnight-source-adapter:well-known-node-releases',
          payload: { note: 'Node.js public release schedule; not fetched from a Midnight repository.' },
          collectedAt: context.collectedAt,
          snapshotId: context.snapshotId,
        }),
      );
    }

    for (const config of this.registry) {
      const repoInfo = await this.client.getRepository(config.owner, config.repo);
      const repositoryId = toRepositoryId(`${config.owner}/${config.repo}`);
      repositories.push({ id: repositoryId, url: repoInfo.htmlUrl, hostingPlatform: 'github' });

      const componentId = toComponentId(`${config.owner}/${config.repo}`);
      components.push({ id: componentId, name: config.componentName, type: config.componentType, repositoryId });

      // Repository and Component existence needs no separate Evidence record: EvidenceSubject
      // only models facts about a release, a dependency, or a relationship (docs/architecture/
      // domain-model.md), and nothing in the engine currently queries "evidence that a repository
      // exists" — every fact that actually feeds a compatibility decision is release-scoped, below.
      const discovered = config.tagPrefix
        ? await this.discoverFromReleases(config, componentId, context)
        : config.manifestPath
          ? await this.discoverFromManifestFallback(config, config.manifestPath, componentId, repoInfo.defaultBranch, context)
          : [];

      for (const { release, releaseEvidence } of discovered) {
        releases.push(release);
        evidence.push(releaseEvidence);
      }
    }

    return { repositories, components, releases, evidence };
  }

  private async discoverFromReleases(
    config: MidnightRepositoryConfig,
    componentId: DiscoveredRelease['componentId'],
    context: IngestionContext,
  ): Promise<readonly { release: DiscoveredRelease; releaseEvidence: Evidence }[]> {
    const allReleases = await this.client.listReleases(config.owner, config.repo);
    const results: { release: DiscoveredRelease; releaseEvidence: Evidence }[] = [];

    for (const ghRelease of allReleases) {
      if (!config.tagPrefix || !ghRelease.tagName.startsWith(config.tagPrefix)) continue;
      const versionString = ghRelease.tagName.slice(config.tagPrefix.length);

      let version;
      try {
        version = semVerScheme.parse(versionString);
      } catch {
        continue; // a tag that doesn't parse as semver is skipped, deterministically, never guessed at
      }

      const releaseId = toReleaseId(`${config.owner}/${config.repo}@${ghRelease.tagName}`);
      const artifact: Artifact = {
        id: toArtifactId(`${config.owner}/${config.repo}@${ghRelease.tagName}:artifact`),
        releaseId,
        type: artifactTypeFor(config),
        locator: githubLocator(config.owner, config.repo, ghRelease.tagName),
      };

      results.push({
        release: {
          id: releaseId,
          componentId,
          version,
          publishedAt: ghRelease.publishedAt ? toTimestamp(ghRelease.publishedAt) : context.collectedAt,
          artifacts: [artifact],
        },
        releaseEvidence: createEvidence({
          id: toEvidenceId(`e-release-${config.owner}-${config.repo}-${ghRelease.tagName}`),
          subject: { kind: 'release', id: releaseId },
          sourceType: 'declared-metadata',
          producedBy: this.name,
          payload: { tagName: ghRelease.tagName, prerelease: ghRelease.prerelease },
          collectedAt: context.collectedAt,
          snapshotId: context.snapshotId,
        }),
      });
    }

    return results;
  }

  private async discoverFromManifestFallback(
    config: MidnightRepositoryConfig,
    manifestPath: string,
    componentId: DiscoveredRelease['componentId'],
    defaultBranch: string,
    context: IngestionContext,
  ): Promise<readonly { release: DiscoveredRelease; releaseEvidence: Evidence }[]> {
    const manifestContent = await this.client.getFileContent(config.owner, config.repo, manifestPath, defaultBranch);
    if (!manifestContent) return [];

    const manifest = JSON.parse(manifestContent) as { version?: string };
    if (!manifest.version) return [];

    let version;
    try {
      version = semVerScheme.parse(manifest.version);
    } catch {
      return [];
    }

    const headCommit = await this.client.getDefaultBranchHeadCommit(config.owner, config.repo, defaultBranch);
    const releaseId = toReleaseId(`${config.owner}/${config.repo}@${defaultBranch}:${headCommit.sha.slice(0, 12)}`);
    const artifact: Artifact = {
      id: toArtifactId(`${config.owner}/${config.repo}@${defaultBranch}:artifact`),
      releaseId,
      type: artifactTypeFor(config),
      locator: githubLocator(config.owner, config.repo, defaultBranch),
    };

    return [
      {
        release: {
          id: releaseId,
          componentId,
          version,
          publishedAt: toTimestamp(headCommit.committedAt),
          artifacts: [artifact],
        },
        releaseEvidence: createEvidence({
          id: toEvidenceId(`e-release-${config.owner}-${config.repo}-head`),
          subject: { kind: 'release', id: releaseId },
          sourceType: 'declared-metadata',
          producedBy: this.name,
          payload: { defaultBranch, headCommitSha: headCommit.sha, manifestVersion: manifest.version },
          collectedAt: context.collectedAt,
          snapshotId: context.snapshotId,
        }),
      },
    ];
  }
}
