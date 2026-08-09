import { describe, expect, it } from 'vitest';
import { PR_COMMENT_MARKER } from '@compass/reporting';
import { postCompatibilityComment } from '../src/post-compatibility-comment.js';
import { FakeIssueCommentsClient } from './fake-issue-comments-client.js';

describe('postCompatibilityComment', () => {
  it('creates a new comment when no prior marked comment exists', async () => {
    const client = new FakeIssueCommentsClient();

    const result = await postCompatibilityComment(client, {
      owner: 'org',
      repo: 'repo',
      pullNumber: 42,
      markdown: `${PR_COMMENT_MARKER}\nreport body`,
    });

    expect(result.action).toBe('created');
    expect(client.comments).toHaveLength(1);
    expect(client.comments[0]?.body).toContain('report body');
  });

  it('updates the existing marked comment instead of creating a second one', async () => {
    const client = new FakeIssueCommentsClient([
      { id: 7, body: `${PR_COMMENT_MARKER}\nold report` },
      { id: 8, body: 'an unrelated human comment' },
    ]);

    const result = await postCompatibilityComment(client, {
      owner: 'org',
      repo: 'repo',
      pullNumber: 42,
      markdown: `${PR_COMMENT_MARKER}\nnew report`,
    });

    expect(result.action).toBe('updated');
    expect(result.commentId).toBe(7);
    expect(client.comments).toHaveLength(2);
    expect(client.comments.find((comment) => comment.id === 7)?.body).toContain('new report');
    expect(client.comments.find((comment) => comment.id === 8)?.body).toBe('an unrelated human comment');
  });

  it('ignores comments without the marker when deciding whether to create or update', async () => {
    const client = new FakeIssueCommentsClient([{ id: 3, body: 'just a regular review comment' }]);

    const result = await postCompatibilityComment(client, {
      owner: 'org',
      repo: 'repo',
      pullNumber: 1,
      markdown: `${PR_COMMENT_MARKER}\nreport`,
    });

    expect(result.action).toBe('created');
    expect(client.comments).toHaveLength(2);
  });
});
