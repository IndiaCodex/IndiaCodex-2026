import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { semVerScheme, toArtifactId, toComponentId, toReleaseId, toSnapshotId, toTimestamp } from '@compass/domain';
import { CompactToolchainCapabilityExtractor } from '../src/compact-toolchain-capability-extractor.js';
import { githubLocator } from '../src/midnight-source-adapter.js';
import { FixtureGitHubClient, loadFixture } from './fixture-github-client.js';

const FIXTURE_PATH = join(import.meta.dirname, 'fixtures/midnight-ecosystem.fixture.json');
const CONTEXT = { snapshotId: toSnapshotId('snap-1'), collectedAt: toTimestamp('2026-01-01T00:00:00.000Z') };

function buildExtractor(): CompactToolchainCapabilityExtractor {
  return new CompactToolchainCapabilityExtractor(new FixtureGitHubClient(loadFixture(FIXTURE_PATH)));
}

describe('CompactToolchainCapabilityExtractor (against the real compact release "compactc-v0.31.1")', () => {
  const releaseId = toReleaseId('midnightntwrk/compact@compactc-v0.31.1');
  const release = {
    id: releaseId,
    componentId: toComponentId('midnightntwrk/compact'),
    version: semVerScheme.parse('0.31.1'),
    publishedAt: CONTEXT.collectedAt,
    artifacts: [
      {
        id: toArtifactId('compact-artifact'),
        releaseId,
        type: 'binary' as const,
        locator: githubLocator('midnightntwrk', 'compact', 'compactc-v0.31.1'),
      },
    ],
  };

  it('extracts the Compact language version embedded in the real release name', async () => {
    const result = await buildExtractor().extract(release, release.artifacts, CONTEXT);
    expect(result.capabilities).toContainEqual(
      expect.objectContaining({ name: 'compact-language', direction: 'provided' }),
    );
    const capability = result.capabilities.find((c) => c.name === 'compact-language');
    expect(capability?.version.raw).toBe('0.23.0');
  });

  it('cites the release name text as evidence', async () => {
    const result = await buildExtractor().extract(release, release.artifacts, CONTEXT);
    expect(result.evidence).toHaveLength(1);
    const payload = result.evidence[0]?.payload as { releaseName?: string } | undefined;
    expect(payload?.releaseName).toContain('Compact language 0.23.0');
  });

  it('does not mark a non-prerelease toolchain version as prerelease', async () => {
    const result = await buildExtractor().extract(release, release.artifacts, CONTEXT);
    expect(result.capabilities.some((c) => c.name === 'prerelease')).toBe(false);
  });

  it('returns an empty result for a release whose name has no parseable language version', async () => {
    const badReleaseId = toReleaseId('midnightntwrk/compact@compactc-v9.9.9');
    const badRelease = {
      ...release,
      id: badReleaseId,
      version: semVerScheme.parse('9.9.9'),
      artifacts: [
        {
          id: toArtifactId('bad-artifact'),
          releaseId: badReleaseId,
          type: 'binary' as const,
          locator: githubLocator('midnightntwrk', 'compact', 'compactc-v9.9.9'),
        },
      ],
    };
    const result = await buildExtractor().extract(badRelease, badRelease.artifacts, CONTEXT);
    expect(result).toEqual({ releaseId: badReleaseId, capabilities: [], dependencies: [], evidence: [] });
  });

  it('returns an empty result for a component this extractor does not handle', async () => {
    const otherReleaseId = toReleaseId('midnightntwrk/midnight-js@v5.0.0-beta.6');
    const otherRelease = {
      id: otherReleaseId,
      componentId: toComponentId('midnightntwrk/midnight-js'),
      version: semVerScheme.parse('5.0.0-beta.6'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [
        {
          id: toArtifactId('other-artifact'),
          releaseId: otherReleaseId,
          type: 'package' as const,
          locator: githubLocator('midnightntwrk', 'midnight-js', 'v5.0.0-beta.6'),
        },
      ],
    };
    const result = await buildExtractor().extract(otherRelease, otherRelease.artifacts, CONTEXT);
    expect(result).toEqual({ releaseId: otherReleaseId, capabilities: [], dependencies: [], evidence: [] });
  });

  it('is deterministic', async () => {
    const extractor = buildExtractor();
    const first = await extractor.extract(release, release.artifacts, CONTEXT);
    const second = await extractor.extract(release, release.artifacts, CONTEXT);
    expect(first).toEqual(second);
  });

  it('returns an empty result when the release has no locator artifact at all', async () => {
    const result = await buildExtractor().extract(release, [], CONTEXT);
    expect(result).toEqual({ releaseId: release.id, capabilities: [], dependencies: [], evidence: [] });
  });

  it('marks a prerelease toolchain version with the "prerelease" capability', async () => {
    const client = new FixtureGitHubClient({
      repositories: {},
      headCommits: {},
      fileContents: {},
      releases: {
        'midnightntwrk/compact': [
          { tagName: 'compactc-v0.32.0-rc.1', name: 'Compact toolchain 0.32.0-rc.1 (Compact language 0.24.0)', publishedAt: null, prerelease: true },
        ],
      },
    });
    const prereleaseId = toReleaseId('midnightntwrk/compact@compactc-v0.32.0-rc.1');
    const prereleaseRelease = {
      id: prereleaseId,
      componentId: toComponentId('midnightntwrk/compact'),
      version: semVerScheme.parse('0.32.0-rc.1'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [
        {
          id: toArtifactId('compact-prerelease-artifact'),
          releaseId: prereleaseId,
          type: 'binary' as const,
          locator: githubLocator('midnightntwrk', 'compact', 'compactc-v0.32.0-rc.1'),
        },
      ],
    };

    const result = await new CompactToolchainCapabilityExtractor(client).extract(prereleaseRelease, prereleaseRelease.artifacts, CONTEXT);
    expect(result.capabilities.some((c) => c.name === 'prerelease')).toBe(true);
  });
});
