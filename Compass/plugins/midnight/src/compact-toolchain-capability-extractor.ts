/**
 * Real Midnight `compact` toolchain releases carry two version numbers in
 * one place: the release name itself states both the toolchain version
 * (already the Release's own version, from discovery) and the Compact
 * *language* version it produces — e.g. a release literally named
 * "Compact toolchain 0.31.1 (Compact language 0.23.0)". That embedded
 * language version is a real, deterministic, evidence-backed fact: it's
 * the capability contracts declare a requirement against via
 * `pragma language_version` (see npm-manifest-capability-extractor.ts).
 */
import { createEvidence, semVerScheme, toEvidenceId } from '@compass/domain';
import type { Capability } from '@compass/domain';
import type { CapabilityExtractionResult, CapabilityExtractorPort, DiscoveredRelease, IngestionContext } from '@compass/plugin-sdk';
import { parseGitHubLocator } from './midnight-source-adapter.js';
import { MIDNIGHT_REPOSITORIES } from './registry.js';
import type { MidnightRepositoryConfig } from './registry.js';
import type { Artifact } from '@compass/domain';
import type { GitHubClient } from './github-client.js';

const LANGUAGE_VERSION_PATTERN = /Compact language (\d+\.\d+\.\d+)/;

export class CompactToolchainCapabilityExtractor implements CapabilityExtractorPort {
  public readonly name = 'compact-toolchain-capability-extractor';

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

    const config = this.registry.find(
      (candidate) => `${candidate.owner}/${candidate.repo}` === release.componentId && candidate.extractorKind === 'compact-toolchain-release',
    );
    if (!config) return empty;

    const locatorArtifact = artifacts.find((artifact) => parseGitHubLocator(artifact.locator));
    const located = locatorArtifact ? parseGitHubLocator(locatorArtifact.locator) : null;
    if (!located) return empty;

    const releases = await this.client.listReleases(located.owner, located.repo);
    const ghRelease = releases.find((candidate) => candidate.tagName === located.ref);
    if (!ghRelease?.name) return empty;

    const match = LANGUAGE_VERSION_PATTERN.exec(ghRelease.name);
    if (!match) return empty;
    const [, languageVersion] = match;
    // The pattern's capture group is `(\d+\.\d+\.\d+)`, mandatory whenever the overall regex
    // matches, so this guard is unreachable in practice — kept only because TypeScript's
    // noUncheckedIndexedAccess types every capture group as possibly undefined.
    if (!languageVersion) return empty;

    const capabilities: Capability[] = [
      { name: 'compact-language', version: semVerScheme.parse(languageVersion), direction: 'provided' },
    ];
    if (release.version.raw.includes('-')) {
      capabilities.push({ name: 'prerelease', version: release.version, direction: 'provided' });
    }

    return {
      releaseId: release.id,
      capabilities,
      dependencies: [],
      evidence: [
        createEvidence({
          id: toEvidenceId(`e-compact-language-${located.owner}-${located.repo}-${located.ref}`),
          subject: { kind: 'release', id: release.id },
          sourceType: 'declared-metadata',
          producedBy: this.name,
          payload: { releaseName: ghRelease.name },
          collectedAt: context.collectedAt,
          snapshotId: context.snapshotId,
        }),
      ],
    };
  }
}
