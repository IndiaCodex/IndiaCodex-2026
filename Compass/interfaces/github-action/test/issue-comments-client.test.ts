import { describe, expect, it } from 'vitest';
import { IssueCommentsRequestError, RestIssueCommentsClient } from '../src/issue-comments-client.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function fakeFetch(handler: (url: string, init?: RequestInit) => Response): typeof fetch {
  return ((url: string | URL, init?: RequestInit) => Promise.resolve(handler(String(url), init))) as typeof fetch;
}

describe('RestIssueCommentsClient', () => {
  it('list fetches comments on the pull request and maps id/body', async () => {
    const client = new RestIssueCommentsClient(
      'test-token',
      fakeFetch((url) => {
        expect(url).toBe('https://api.github.com/repos/org/repo/issues/42/comments');
        return jsonResponse([{ id: 1, body: 'hello' }, { id: 2, body: null }]);
      }),
    );

    const comments = await client.list('org', 'repo', 42);
    expect(comments).toEqual([{ id: 1, body: 'hello' }, { id: 2, body: '' }]);
  });

  it('create POSTs the body to the comments endpoint', async () => {
    let capturedMethod: string | undefined;
    let capturedBody: string | undefined;
    const client = new RestIssueCommentsClient(
      'test-token',
      fakeFetch((url, init) => {
        expect(url).toBe('https://api.github.com/repos/org/repo/issues/42/comments');
        capturedMethod = init?.method;
        capturedBody = init?.body as string;
        return jsonResponse({ id: 99, body: 'new comment' });
      }),
    );

    const created = await client.create('org', 'repo', 42, 'new comment');
    expect(capturedMethod).toBe('POST');
    expect(JSON.parse(capturedBody ?? '{}')).toEqual({ body: 'new comment' });
    expect(created).toEqual({ id: 99, body: 'new comment' });
  });

  it('update PATCHes the specific comment endpoint', async () => {
    let capturedMethod: string | undefined;
    const client = new RestIssueCommentsClient(
      'test-token',
      fakeFetch((url, init) => {
        expect(url).toBe('https://api.github.com/repos/org/repo/issues/comments/99');
        capturedMethod = init?.method;
        return jsonResponse({ id: 99, body: 'updated comment' });
      }),
    );

    const updated = await client.update('org', 'repo', 99, 'updated comment');
    expect(capturedMethod).toBe('PATCH');
    expect(updated).toEqual({ id: 99, body: 'updated comment' });
  });

  it('includes the Authorization header', async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const client = new RestIssueCommentsClient(
      'test-token',
      fakeFetch((_url, init) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return jsonResponse([]);
      }),
    );

    await client.list('org', 'repo', 1);
    expect(capturedHeaders).toMatchObject({ Authorization: 'Bearer test-token' });
  });

  it('throws IssueCommentsRequestError on a non-ok response from list', async () => {
    const client = new RestIssueCommentsClient(
      'test-token',
      fakeFetch(() => new Response('not found', { status: 404 })),
    );

    await expect(client.list('org', 'repo', 1)).rejects.toBeInstanceOf(IssueCommentsRequestError);
  });

  it('throws IssueCommentsRequestError on a non-ok response from create', async () => {
    const client = new RestIssueCommentsClient(
      'test-token',
      fakeFetch(() => new Response('forbidden', { status: 403 })),
    );

    await expect(client.create('org', 'repo', 1, 'body')).rejects.toBeInstanceOf(IssueCommentsRequestError);
  });

  it('throws IssueCommentsRequestError on a non-ok response from update', async () => {
    const client = new RestIssueCommentsClient(
      'test-token',
      fakeFetch(() => new Response('gone', { status: 410 })),
    );

    await expect(client.update('org', 'repo', 1, 'body')).rejects.toBeInstanceOf(IssueCommentsRequestError);
  });
});
