import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toSnapshotId, toTimestamp } from '@compass/domain';
import { MidnightSourceAdapter, parseGitHubLocator } from '../src/midnight-source-adapter.js';
import { MIDNIGHT_REPOSITORIES } from '../src/registry.js';
import { FixtureGitHubClient, loadFixture } from './fixture-github-client.js';
import type { MidnightRepositoryConfig } from '../src/registry.js';

const FIXTURE_PATH = join(import.meta.dirname, 'fixtures/midnight-ecosystem.fixture.json');
const CONTEXT = { snapshotId: toSnapshotId('snap-1'), collectedAt: toTimestamp('2026-01-01T00:00:00.000Z') };

function buildAdapter(): MidnightSourceAdapter {
  return new MidnightSourceAdapter(new FixtureGitHubClient(loadFixture(FIXTURE_PATH)));
}

describe('parseGitHubLocator', () => {
  it('parses a well-formed locator', () => {
    expect(parseGitHubLocator('github:midnightntwrk/midnight-js@v5.0.0-beta.6')).toEqual({
      owner: 'midnightntwrk',
      repo: 'midnight-js',
      ref: 'v5.0.0-beta.6',
    });
  });

  it('returns null for a malformed locator', () => {
    expect(parseGitHubLocator('not-a-locator')).toBeNull();
  });
});

describe('MidnightSourceAdapter (against real, recorded GitHub data)', () => {
  it('discovers every registered repository and component, plus the synthetic Node.js runtime', async () => {
    const result = await buildAdapter().discover(CONTEXT);

    expect(result.repositories.map((r) => r.id).sort()).toEqual(
      ['nodejs/node', ...MIDNIGHT_REPOSITORIES.map((c) => `${c.owner}/${c.repo}`)].sort(),
    );
    expect(result.components).toHaveLength(MIDNIGHT_REPOSITORIES.length + 1);

    const midnightJs = result.components.find((c) => c.id === 'midnightntwrk/midnight-js');
    expect(midnightJs).toMatchObject({ type: 'sdk', name: 'midnight-js' });

    const nodeComponent = result.components.find((c) => c.id === 'nodejs/node');
    expect(nodeComponent).toMatchObject({ type: 'runtime' });
  });

  it('filters releases by the configured tag prefix and strips it to a parseable version', async () => {
    const result = await buildAdapter().discover(CONTEXT);
    const midnightJsReleases = result.releases.filter((r) => r.componentId === 'midnightntwrk/midnight-js');

    expect(midnightJsReleases.length).toBeGreaterThan(0);
    for (const release of midnightJsReleases) {
      expect(release.version.raw).not.toMatch(/^v/); // the "v" prefix was stripped
    }
    expect(midnightJsReleases.some((r) => r.version.raw === '5.0.0-beta.6')).toBe(true);
  });

  it('only tracks compact releases matching the "compactc-v" prefix, excluding the older "compact-v" naming', async () => {
    const result = await buildAdapter().discover(CONTEXT);
    const compactReleases = result.releases.filter((r) => r.componentId === 'midnightntwrk/compact');

    expect(compactReleases.length).toBeGreaterThan(0);
    // Every release's version must be a bare semver string with no leftover prefix.
    for (const release of compactReleases) {
      expect(release.version.raw).toMatch(/^\d+\.\d+\.\d+/);
    }
  });

  it('falls back to the package.json version at the default branch HEAD when a repo has no releases (example-counter)', async () => {
    const result = await buildAdapter().discover(CONTEXT);
    const exampleCounterReleases = result.releases.filter((r) => r.componentId === 'midnightntwrk/example-counter');

    expect(exampleCounterReleases).toHaveLength(1);
    expect(exampleCounterReleases[0]?.version.raw).toBe('2.1.1'); // the real package.json version
  });

  it('produces zero releases for a component with neither releases nor a manifest (midnight-docs)', async () => {
    const result = await buildAdapter().discover(CONTEXT);
    const docsReleases = result.releases.filter((r) => r.componentId === 'midnightntwrk/midnight-docs');
    expect(docsReleases).toEqual([]);
  });

  it('produces evidence citing every discovered release, scoped to the given snapshot', async () => {
    const result = await buildAdapter().discover(CONTEXT);
    for (const release of result.releases) {
      const relevantEvidence = result.evidence.filter(
        (e) => e.subject.kind === 'release' && e.subject.id === release.id,
      );
      expect(relevantEvidence.length).toBeGreaterThan(0);
      for (const evidence of relevantEvidence) {
        expect(evidence.snapshotId).toBe(CONTEXT.snapshotId);
      }
    }
  });

  it('is deterministic: discovering twice against the same fixture yields identical results', async () => {
    const first = await buildAdapter().discover(CONTEXT);
    const second = await buildAdapter().discover(CONTEXT);
    expect(first).toEqual(second);
  });

  it('includes the three well-known Node.js releases with no locator artifacts', async () => {
    const result = await buildAdapter().discover(CONTEXT);
    const nodeReleases = result.releases.filter((r) => r.componentId === 'nodejs/node');
    expect(nodeReleases.map((r) => r.version.raw).sort()).toEqual(['18.0.0', '20.0.0', '22.0.0']);
  });
});

describe('MidnightSourceAdapter (edge cases via a synthetic registry + fixture)', () => {
  const repoConfig: MidnightRepositoryConfig = {
    owner: 'test-org',
    repo: 'test-repo',
    componentName: 'test-repo',
    componentType: 'documentation',
    tagPrefix: 'v',
    manifestPath: null,
    providedPackageName: null,
    extractorKind: 'none',
    contractPath: null,
  };

  it('skips a tag matching the prefix whose remainder does not parse as semver', async () => {
    const client = new FixtureGitHubClient({
      repositories: { 'test-org/test-repo': { fullName: 'test-org/test-repo', htmlUrl: 'https://github.com/test-org/test-repo', defaultBranch: 'main' } },
      releases: {
        'test-org/test-repo': [
          { tagName: 'v-not-a-version', name: null, publishedAt: '2026-01-01T00:00:00Z', prerelease: false },
          { tagName: 'v1.0.0', name: null, publishedAt: '2026-01-01T00:00:00Z', prerelease: false },
        ],
      },
      headCommits: {},
      fileContents: {},
    });
    const result = await new MidnightSourceAdapter(client, [repoConfig]).discover(CONTEXT);
    const testRepoReleases = result.releases.filter((r) => r.componentId === 'test-org/test-repo');
    expect(testRepoReleases.map((r) => r.version.raw)).toEqual(['1.0.0']);
  });

  it('falls back to the ingestion context\'s collectedAt when a release has no publishedAt', async () => {
    const client = new FixtureGitHubClient({
      repositories: { 'test-org/test-repo': { fullName: 'test-org/test-repo', htmlUrl: 'https://github.com/test-org/test-repo', defaultBranch: 'main' } },
      releases: { 'test-org/test-repo': [{ tagName: 'v1.0.0', name: null, publishedAt: null, prerelease: false }] },
      headCommits: {},
      fileContents: {},
    });
    const result = await new MidnightSourceAdapter(client, [repoConfig]).discover(CONTEXT);
    const testRepoRelease = result.releases.find((r) => r.componentId === 'test-org/test-repo');
    expect(testRepoRelease?.publishedAt).toBe(CONTEXT.collectedAt);
  });

  it('uses artifact type "documentation" for a documentation-typed component with releases', async () => {
    const client = new FixtureGitHubClient({
      repositories: { 'test-org/test-repo': { fullName: 'test-org/test-repo', htmlUrl: 'https://github.com/test-org/test-repo', defaultBranch: 'main' } },
      releases: { 'test-org/test-repo': [{ tagName: 'v1.0.0', name: null, publishedAt: '2026-01-01T00:00:00Z', prerelease: false }] },
      headCommits: {},
      fileContents: {},
    });
    const result = await new MidnightSourceAdapter(client, [repoConfig]).discover(CONTEXT);
    const testRepoRelease = result.releases.find((r) => r.componentId === 'test-org/test-repo');
    expect(testRepoRelease?.artifacts[0]?.type).toBe('documentation');
  });

  it('produces no release when the manifest-fallback file content is missing', async () => {
    const manifestConfig: MidnightRepositoryConfig = { ...repoConfig, tagPrefix: null, manifestPath: 'package.json', extractorKind: 'npm-manifest' };
    const client = new FixtureGitHubClient({
      repositories: { 'test-org/test-repo': { fullName: 'test-org/test-repo', htmlUrl: 'https://github.com/test-org/test-repo', defaultBranch: 'main' } },
      releases: {},
      headCommits: {},
      fileContents: {},
    });
    const result = await new MidnightSourceAdapter(client, [manifestConfig]).discover(CONTEXT);
    expect(result.releases.filter((r) => r.componentId === 'test-org/test-repo')).toEqual([]);
  });

  it('produces no release when the manifest has no version field', async () => {
    const manifestConfig: MidnightRepositoryConfig = { ...repoConfig, tagPrefix: null, manifestPath: 'package.json', extractorKind: 'npm-manifest' };
    const client = new FixtureGitHubClient({
      repositories: { 'test-org/test-repo': { fullName: 'test-org/test-repo', htmlUrl: 'https://github.com/test-org/test-repo', defaultBranch: 'main' } },
      releases: {},
      headCommits: {},
      fileContents: { 'test-org/test-repo@main:package.json': JSON.stringify({ name: 'test-repo' }) },
    });
    const result = await new MidnightSourceAdapter(client, [manifestConfig]).discover(CONTEXT);
    expect(result.releases.filter((r) => r.componentId === 'test-org/test-repo')).toEqual([]);
  });

  it('produces no release when the manifest version does not parse as semver', async () => {
    const manifestConfig: MidnightRepositoryConfig = { ...repoConfig, tagPrefix: null, manifestPath: 'package.json', extractorKind: 'npm-manifest' };
    const client = new FixtureGitHubClient({
      repositories: { 'test-org/test-repo': { fullName: 'test-org/test-repo', htmlUrl: 'https://github.com/test-org/test-repo', defaultBranch: 'main' } },
      releases: {},
      headCommits: {},
      fileContents: { 'test-org/test-repo@main:package.json': JSON.stringify({ name: 'test-repo', version: 'not-a-version' }) },
    });
    const result = await new MidnightSourceAdapter(client, [manifestConfig]).discover(CONTEXT);
    expect(result.releases.filter((r) => r.componentId === 'test-org/test-repo')).toEqual([]);
  });
});
