import { describe, expect, it } from 'vitest';
import { GitHubRequestError, RestGitHubClient } from '../src/rest-github-client.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function fakeFetch(handler: (url: string, init?: RequestInit) => Response): typeof fetch {
  return ((url: string | URL, init?: RequestInit) => Promise.resolve(handler(String(url), init))) as typeof fetch;
}

describe('RestGitHubClient', () => {
  it('getRepository maps the real GitHub response shape to GitHubRepositoryInfo', async () => {
    const client = new RestGitHubClient(
      undefined,
      fakeFetch((url) => {
        expect(url).toBe('https://api.github.com/repos/midnightntwrk/midnight-js');
        return jsonResponse({ full_name: 'midnightntwrk/midnight-js', html_url: 'https://github.com/midnightntwrk/midnight-js', default_branch: 'main' });
      }),
    );

    const info = await client.getRepository('midnightntwrk', 'midnight-js');
    expect(info).toEqual({ fullName: 'midnightntwrk/midnight-js', htmlUrl: 'https://github.com/midnightntwrk/midnight-js', defaultBranch: 'main' });
  });

  it('includes an Authorization header when a token is supplied', async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const client = new RestGitHubClient(
      'test-token',
      fakeFetch((_url, init) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return jsonResponse({ full_name: 'a/b', html_url: 'https://github.com/a/b', default_branch: 'main' });
      }),
    );

    await client.getRepository('a', 'b');
    expect(capturedHeaders).toMatchObject({ Authorization: 'Bearer test-token' });
  });

  it('omits the Authorization header when no token is supplied', async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const client = new RestGitHubClient(
      undefined,
      fakeFetch((_url, init) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return jsonResponse({ full_name: 'a/b', html_url: 'https://github.com/a/b', default_branch: 'main' });
      }),
    );

    await client.getRepository('a', 'b');
    expect(capturedHeaders?.Authorization).toBeUndefined();
  });

  it('listReleases maps every field including prerelease', async () => {
    const client = new RestGitHubClient(
      undefined,
      fakeFetch(() =>
        jsonResponse([
          { tag_name: 'v1.0.0', name: 'Release v1.0.0', published_at: '2026-01-01T00:00:00Z', prerelease: false },
          { tag_name: 'v2.0.0-beta.1', name: null, published_at: null, prerelease: true },
        ]),
      ),
    );

    const releases = await client.listReleases('a', 'b');
    expect(releases).toEqual([
      { tagName: 'v1.0.0', name: 'Release v1.0.0', publishedAt: '2026-01-01T00:00:00Z', prerelease: false },
      { tagName: 'v2.0.0-beta.1', name: null, publishedAt: null, prerelease: true },
    ]);
  });

  it('getDefaultBranchHeadCommit extracts sha and committer date', async () => {
    const client = new RestGitHubClient(
      undefined,
      fakeFetch(() => jsonResponse({ sha: 'abc123', commit: { committer: { date: '2026-01-01T00:00:00Z' } } })),
    );

    const commit = await client.getDefaultBranchHeadCommit('a', 'b', 'main');
    expect(commit).toEqual({ sha: 'abc123', committedAt: '2026-01-01T00:00:00Z' });
  });

  it('getFileContent decodes base64 content', async () => {
    const client = new RestGitHubClient(
      undefined,
      fakeFetch(() => jsonResponse({ content: Buffer.from('{"name":"test"}').toString('base64') })),
    );

    const content = await client.getFileContent('a', 'b', 'package.json', 'main');
    expect(content).toBe('{"name":"test"}');
  });

  it('getFileContent returns null for a 404 (missing file), not an error', async () => {
    const client = new RestGitHubClient(undefined, fakeFetch(() => new Response(null, { status: 404 })));
    const content = await client.getFileContent('a', 'b', 'missing.json', 'main');
    expect(content).toBeNull();
  });

  it('throws GitHubRequestError for a non-2xx, non-404 response', async () => {
    const client = new RestGitHubClient(undefined, fakeFetch(() => new Response(null, { status: 500 })));
    await expect(client.getRepository('a', 'b')).rejects.toThrow(GitHubRequestError);
  });

  it('getFileContent also throws GitHubRequestError for a non-2xx, non-404 response', async () => {
    const client = new RestGitHubClient(undefined, fakeFetch(() => new Response(null, { status: 500 })));
    await expect(client.getFileContent('a', 'b', 'package.json', 'main')).rejects.toThrow(GitHubRequestError);
  });

  it('GitHubRequestError carries the HTTP status', async () => {
    const client = new RestGitHubClient(undefined, fakeFetch(() => new Response(null, { status: 403 })));
    try {
      await client.getRepository('a', 'b');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GitHubRequestError);
      expect((error as GitHubRequestError).status).toBe(403);
    }
  });
});
