import type { GitHubClient, GitHubHeadCommit, GitHubRelease, GitHubRepositoryInfo } from './github-client.js';

export class GitHubRequestError extends Error {
  public constructor(
    method: string,
    url: string,
    public readonly status: number,
  ) {
    super(`GitHub API request failed: ${method} ${url} -> ${status}`);
    this.name = 'GitHubRequestError';
  }
}

/**
 * The real GitHub REST API v3 client, used in production. Not exercised
 * against the live API in this package's own test suite — see
 * FixtureGitHubClient for the client ingestion tests actually run against
 * (docs/architecture/cross-cutting-concerns.md#testing-strategy: plugins
 * are tested against recorded fixtures, not live network calls). Its own
 * request-shaping and error-handling logic is still tested directly,
 * against a hand-written fake `fetch` — a real function satisfying the
 * same contract, not a mocking library.
 */
export class RestGitHubClient implements GitHubClient {
  private readonly baseUrl = 'https://api.github.com';

  /**
   * @param token Optional personal access token, raises GitHub's unauthenticated rate limit. Never logged.
   * @param fetchImpl Injectable for testing; defaults to the real global `fetch`.
   */
  public constructor(
    private readonly token?: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    return headers;
  }

  private async getJson<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchImpl(url, { headers: this.headers() });
    if (!response.ok) {
      throw new GitHubRequestError('GET', url, response.status);
    }
    return (await response.json()) as T;
  }

  public async getRepository(owner: string, repo: string): Promise<GitHubRepositoryInfo> {
    const data = await this.getJson<{ full_name: string; html_url: string; default_branch: string }>(
      `/repos/${owner}/${repo}`,
    );
    return { fullName: data.full_name, htmlUrl: data.html_url, defaultBranch: data.default_branch };
  }

  public async listReleases(owner: string, repo: string): Promise<readonly GitHubRelease[]> {
    const data = await this.getJson<
      readonly { tag_name: string; name: string | null; published_at: string | null; prerelease: boolean }[]
    >(`/repos/${owner}/${repo}/releases?per_page=100`);
    return data.map((release) => ({
      tagName: release.tag_name,
      name: release.name,
      publishedAt: release.published_at,
      prerelease: release.prerelease,
    }));
  }

  public async getDefaultBranchHeadCommit(owner: string, repo: string, branch: string): Promise<GitHubHeadCommit> {
    const data = await this.getJson<{ sha: string; commit: { committer: { date: string } } }>(
      `/repos/${owner}/${repo}/commits/${branch}`,
    );
    return { sha: data.sha, committedAt: data.commit.committer.date };
  }

  public async getFileContent(owner: string, repo: string, path: string, ref: string): Promise<string | null> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`;
    const response = await this.fetchImpl(url, { headers: this.headers() });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new GitHubRequestError('GET', url, response.status);
    }
    const data = (await response.json()) as { content: string };
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }
}
