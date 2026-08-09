/**
 * The narrow slice of the GitHub API this plugin needs, behind an
 * interface so ingestion can be tested against recorded fixtures instead
 * of live network calls (docs/architecture/cross-cutting-concerns.md#testing-strategy)
 * while still running against the real GitHub API in production via
 * `RestGitHubClient`.
 */
export interface GitHubRepositoryInfo {
  readonly fullName: string;
  readonly htmlUrl: string;
  readonly defaultBranch: string;
}

export interface GitHubRelease {
  readonly tagName: string;
  readonly name: string | null;
  readonly publishedAt: string | null;
  readonly prerelease: boolean;
}

export interface GitHubHeadCommit {
  readonly sha: string;
  readonly committedAt: string;
}

export interface GitHubClient {
  getRepository(owner: string, repo: string): Promise<GitHubRepositoryInfo>;
  listReleases(owner: string, repo: string): Promise<readonly GitHubRelease[]>;
  getDefaultBranchHeadCommit(owner: string, repo: string, branch: string): Promise<GitHubHeadCommit>;
  /** Returns null if the path doesn't exist at that ref — a missing file is a fact, not an error. */
  getFileContent(owner: string, repo: string, path: string, ref: string): Promise<string | null>;
}
