/**
 * A GitHubClient backed by a recorded fixture file instead of live network
 * calls — real API responses captured once from the real
 * midnightntwrk GitHub organization (see fixtures/midnight-ecosystem.fixture.json),
 * replayed deterministically so this plugin's tests never depend on
 * network access or on GitHub's current state.
 */
import { readFileSync } from 'node:fs';
import type { GitHubClient, GitHubHeadCommit, GitHubRelease, GitHubRepositoryInfo } from '../src/github-client.js';

interface MidnightEcosystemFixture {
  readonly repositories: Record<string, GitHubRepositoryInfo>;
  readonly releases: Record<string, readonly GitHubRelease[]>;
  readonly fileContents: Record<string, string>;
  readonly headCommits: Record<string, GitHubHeadCommit>;
}

export function loadFixture(path: string): MidnightEcosystemFixture {
  return JSON.parse(readFileSync(path, 'utf-8')) as MidnightEcosystemFixture;
}

export class FixtureGitHubClient implements GitHubClient {
  public constructor(private readonly fixture: MidnightEcosystemFixture) {}

  public getRepository(owner: string, repo: string): Promise<GitHubRepositoryInfo> {
    const info = this.fixture.repositories[`${owner}/${repo}`];
    if (!info) throw new Error(`No fixture repository recorded for ${owner}/${repo}`);
    return Promise.resolve(info);
  }

  public listReleases(owner: string, repo: string): Promise<readonly GitHubRelease[]> {
    return Promise.resolve(this.fixture.releases[`${owner}/${repo}`] ?? []);
  }

  public getDefaultBranchHeadCommit(owner: string, repo: string, branch: string): Promise<GitHubHeadCommit> {
    const commit = this.fixture.headCommits[`${owner}/${repo}@${branch}`];
    if (!commit) throw new Error(`No fixture head commit recorded for ${owner}/${repo}@${branch}`);
    return Promise.resolve(commit);
  }

  public getFileContent(owner: string, repo: string, path: string, ref: string): Promise<string | null> {
    const content = this.fixture.fileContents[`${owner}/${repo}@${ref}:${path}`];
    return Promise.resolve(content ?? null);
  }
}
