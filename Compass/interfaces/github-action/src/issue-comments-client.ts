/**
 * A minimal client for the GitHub Issue Comments API — pull requests are
 * issues for commenting purposes in GitHub's REST API. Hand-rolled against
 * an injectable `fetch`, the same discipline `RestGitHubClient` in
 * `@compass/plugin-midnight` already established, rather than pulling in
 * `@actions/github` for what is a handful of well-documented REST calls.
 */
export interface IssueComment {
  readonly id: number;
  readonly body: string;
}

export interface IssueCommentsClient {
  list(owner: string, repo: string, issueNumber: number): Promise<readonly IssueComment[]>;
  create(owner: string, repo: string, issueNumber: number, body: string): Promise<IssueComment>;
  update(owner: string, repo: string, commentId: number, body: string): Promise<IssueComment>;
}

export class IssueCommentsRequestError extends Error {
  public constructor(
    method: string,
    url: string,
    public readonly status: number,
  ) {
    super(`GitHub API request failed: ${method} ${url} -> ${status}`);
    this.name = 'IssueCommentsRequestError';
  }
}

interface GitHubIssueCommentPayload {
  readonly id: number;
  readonly body: string | null;
}

export class RestIssueCommentsClient implements IssueCommentsClient {
  private readonly baseUrl = 'https://api.github.com';

  public constructor(
    private readonly token: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private headers(): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  public async list(owner: string, repo: string, issueNumber: number): Promise<readonly IssueComment[]> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
    const response = await this.fetchImpl(url, { headers: this.headers() });
    if (!response.ok) throw new IssueCommentsRequestError('GET', url, response.status);
    const payload = (await response.json()) as readonly GitHubIssueCommentPayload[];
    return payload.map((comment) => ({ id: comment.id, body: comment.body ?? '' }));
  }

  public async create(owner: string, repo: string, issueNumber: number, body: string): Promise<IssueComment> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
    const response = await this.fetchImpl(url, { method: 'POST', headers: this.headers(), body: JSON.stringify({ body }) });
    if (!response.ok) throw new IssueCommentsRequestError('POST', url, response.status);
    const created = (await response.json()) as GitHubIssueCommentPayload;
    return { id: created.id, body: created.body ?? '' };
  }

  public async update(owner: string, repo: string, commentId: number, body: string): Promise<IssueComment> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/comments/${commentId}`;
    const response = await this.fetchImpl(url, { method: 'PATCH', headers: this.headers(), body: JSON.stringify({ body }) });
    if (!response.ok) throw new IssueCommentsRequestError('PATCH', url, response.status);
    const updated = (await response.json()) as GitHubIssueCommentPayload;
    return { id: updated.id, body: updated.body ?? '' };
  }
}
