import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { semVerScheme, toArtifactId, toComponentId, toReleaseId, toSnapshotId, toTimestamp } from '@compass/domain';
import { githubLocator } from '../src/midnight-source-adapter.js';
import { NpmManifestCapabilityExtractor } from '../src/npm-manifest-capability-extractor.js';
import { FixtureGitHubClient, loadFixture } from './fixture-github-client.js';

const FIXTURE_PATH = join(import.meta.dirname, 'fixtures/midnight-ecosystem.fixture.json');
const CONTEXT = { snapshotId: toSnapshotId('snap-1'), collectedAt: toTimestamp('2026-01-01T00:00:00.000Z') };

function buildExtractor(): NpmManifestCapabilityExtractor {
  return new NpmManifestCapabilityExtractor(new FixtureGitHubClient(loadFixture(FIXTURE_PATH)));
}

function artifactFor(owner: string, repo: string, ref: string, releaseId: ReturnType<typeof toReleaseId>) {
  return { id: toArtifactId(`${owner}-${repo}-${ref}`), releaseId, type: 'package' as const, locator: githubLocator(owner, repo, ref) };
}

describe('NpmManifestCapabilityExtractor (against the real midnight-js manifest)', () => {
  it('extracts the package name+version as a provided capability', async () => {
    const releaseId = toReleaseId('midnightntwrk/midnight-js@v5.0.0-beta.6');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/midnight-js'),
      version: semVerScheme.parse('5.0.0-beta.6'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'midnight-js', 'v5.0.0-beta.6', releaseId)],
    };

    const result = await buildExtractor().extract(release, release.artifacts, CONTEXT);

    expect(result.capabilities).toContainEqual(
      expect.objectContaining({ name: '@midnight-ntwrk/midnight-js', direction: 'provided' }),
    );
  });

  it('marks a prerelease version with the "prerelease" capability', async () => {
    const releaseId = toReleaseId('midnightntwrk/midnight-js@v5.0.0-beta.6');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/midnight-js'),
      version: semVerScheme.parse('5.0.0-beta.6'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'midnight-js', 'v5.0.0-beta.6', releaseId)],
    };

    const result = await buildExtractor().extract(release, release.artifacts, CONTEXT);

    expect(result.capabilities.some((c) => c.name === 'prerelease')).toBe(true);
  });

  it('extracts the real engines.node field as a Dependency on the Node.js runtime component', async () => {
    const releaseId = toReleaseId('midnightntwrk/midnight-js@v5.0.0-beta.6');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/midnight-js'),
      version: semVerScheme.parse('5.0.0-beta.6'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'midnight-js', 'v5.0.0-beta.6', releaseId)],
    };

    const result = await buildExtractor().extract(release, release.artifacts, CONTEXT);

    const nodeDependency = result.dependencies.find((d) => d.targetComponentId === 'nodejs/node');
    expect(nodeDependency).toBeDefined();
    expect(nodeDependency?.constraint).toEqual({ kind: 'version-range', range: '>=22' });
  });

  it('extracts the real example-counter -> midnight-js dependency (a genuine cross-repo Dependency)', async () => {
    const releaseId = toReleaseId('midnightntwrk/example-counter@main:head');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/example-counter'),
      version: semVerScheme.parse('2.1.1'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'example-counter', 'main', releaseId)],
    };

    const result = await buildExtractor().extract(release, release.artifacts, CONTEXT);

    const midnightJsDependency = result.dependencies.find((d) => d.targetComponentId === 'midnightntwrk/midnight-js');
    expect(midnightJsDependency).toBeDefined();
    expect(midnightJsDependency?.constraint).toEqual({ kind: 'version-range', range: '^4.0.4' });
  });

  it('extracts a compact-language capability requirement from the real contract\'s pragma directive', async () => {
    const releaseId = toReleaseId('midnightntwrk/example-counter@main:head');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/example-counter'),
      version: semVerScheme.parse('2.1.1'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'example-counter', 'main', releaseId)],
    };

    const result = await buildExtractor().extract(release, release.artifacts, CONTEXT);

    const compactDependency = result.dependencies.find((d) => d.targetComponentId === 'midnightntwrk/compact');
    expect(compactDependency).toBeDefined();
    expect(compactDependency?.constraint).toEqual({ kind: 'capability', name: 'compact-language', range: '>=0.20' });
  });

  it('does not model a dependency on an untracked external package (e.g. would-be "chalk")', async () => {
    const releaseId = toReleaseId('midnightntwrk/create-mn-app@v0.4.4');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/create-mn-app'),
      version: semVerScheme.parse('0.4.4'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'create-mn-app', 'v0.4.4', releaseId)],
    };

    const result = await buildExtractor().extract(release, release.artifacts, CONTEXT);

    // create-mn-app's real dependencies (chalk, commander, etc.) are all untracked by this plugin.
    expect(result.dependencies.every((d) => d.targetComponentId === 'nodejs/node')).toBe(true);
  });

  it('returns an empty result for a component this extractor does not handle (e.g. the runtime)', async () => {
    const releaseId = toReleaseId('midnightntwrk/midnight-node@node-1.0.1');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/midnight-node'),
      version: semVerScheme.parse('1.0.1'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'midnight-node', 'node-1.0.1', releaseId)],
    };

    const result = await buildExtractor().extract(release, release.artifacts, CONTEXT);
    expect(result).toEqual({ releaseId, capabilities: [], dependencies: [], evidence: [] });
  });

  it('returns an empty result when the release has no locator artifact at all', async () => {
    const releaseId = toReleaseId('midnightntwrk/midnight-js@no-artifact');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/midnight-js'),
      version: semVerScheme.parse('1.0.0'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [],
    };

    const result = await buildExtractor().extract(release, [], CONTEXT);
    expect(result).toEqual({ releaseId, capabilities: [], dependencies: [], evidence: [] });
  });

  it('marks a real peerDependency with kind "peer" rather than "required"', async () => {
    // midnight-js's own manifest declares its internal deps as plain "dependencies", but the
    // extractor must still distinguish peerDependencies when a manifest has them. Exercise this
    // against a synthetic manifest fixture served through the same real FixtureGitHubClient path.
    const client = new FixtureGitHubClient({
      repositories: {},
      releases: {},
      headCommits: {},
      fileContents: {
        'midnightntwrk/midnight-js@v9.9.9:packages/midnight-js/package.json': JSON.stringify({
          name: '@midnight-ntwrk/midnight-js',
          version: '9.9.9',
          peerDependencies: { 'create-mn-app': '>=0.4.0' },
        }),
      },
    });
    const extractor = new NpmManifestCapabilityExtractor(client);
    const releaseId = toReleaseId('midnightntwrk/midnight-js@v9.9.9');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/midnight-js'),
      version: semVerScheme.parse('9.9.9'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'midnight-js', 'v9.9.9', releaseId)],
    };

    const result = await extractor.extract(release, release.artifacts, CONTEXT);
    const dependency = result.dependencies.find((d) => d.targetComponentId === 'midnightntwrk/create-mn-app');
    expect(dependency?.kind).toBe('peer');
  });

  it('returns no contract dependency when the contract file itself is missing at that ref', async () => {
    const client = new FixtureGitHubClient({
      repositories: {},
      releases: {},
      headCommits: {},
      fileContents: {
        'midnightntwrk/example-counter@main:package.json': JSON.stringify({ name: 'example-counter', version: '1.0.0' }),
        // deliberately no 'contract/src/counter.compact' entry
      },
    });
    const extractor = new NpmManifestCapabilityExtractor(client);
    const releaseId = toReleaseId('midnightntwrk/example-counter@main');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/example-counter'),
      version: semVerScheme.parse('1.0.0'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'example-counter', 'main', releaseId)],
    };

    const result = await extractor.extract(release, release.artifacts, CONTEXT);
    expect(result.dependencies.find((d) => d.targetComponentId === 'midnightntwrk/compact')).toBeUndefined();
  });

  it('returns no contract dependency when the contract file has no recognizable pragma directive', async () => {
    const client = new FixtureGitHubClient({
      repositories: {},
      releases: {},
      headCommits: {},
      fileContents: {
        'midnightntwrk/example-counter@main:package.json': JSON.stringify({ name: 'example-counter', version: '1.0.0' }),
        'midnightntwrk/example-counter@main:contract/src/counter.compact': '// no pragma line in this file at all\n',
      },
    });
    const extractor = new NpmManifestCapabilityExtractor(client);
    const releaseId = toReleaseId('midnightntwrk/example-counter@main');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/example-counter'),
      version: semVerScheme.parse('1.0.0'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'example-counter', 'main', releaseId)],
    };

    const result = await extractor.extract(release, release.artifacts, CONTEXT);
    expect(result.dependencies.find((d) => d.targetComponentId === 'midnightntwrk/compact')).toBeUndefined();
  });

  it('returns an empty result when the manifest is missing a name or version field', async () => {
    const client = new FixtureGitHubClient({
      repositories: {},
      releases: {},
      headCommits: {},
      fileContents: {
        'midnightntwrk/create-mn-app@v0.0.0:package.json': JSON.stringify({ name: 'create-mn-app' }), // no version
      },
    });
    const extractor = new NpmManifestCapabilityExtractor(client);
    const releaseId = toReleaseId('midnightntwrk/create-mn-app@v0.0.0');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/create-mn-app'),
      version: semVerScheme.parse('0.0.0'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'create-mn-app', 'v0.0.0', releaseId)],
    };

    const result = await extractor.extract(release, release.artifacts, CONTEXT);
    expect(result).toEqual({ releaseId, capabilities: [], dependencies: [], evidence: [] });
  });

  it('is deterministic', async () => {
    const releaseId = toReleaseId('midnightntwrk/midnight-js@v5.0.0-beta.6');
    const release = {
      id: releaseId,
      componentId: toComponentId('midnightntwrk/midnight-js'),
      version: semVerScheme.parse('5.0.0-beta.6'),
      publishedAt: CONTEXT.collectedAt,
      artifacts: [artifactFor('midnightntwrk', 'midnight-js', 'v5.0.0-beta.6', releaseId)],
    };

    const extractor = buildExtractor();
    const first = await extractor.extract(release, release.artifacts, CONTEXT);
    const second = await extractor.extract(release, release.artifacts, CONTEXT);
    expect(first).toEqual(second);
  });
});
