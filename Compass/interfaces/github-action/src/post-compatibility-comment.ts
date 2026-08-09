/**
 * Finds this Action's own prior comment on a pull request (by
 * `PR_COMMENT_MARKER`, from `@compass/reporting`) and updates it, or
 * creates a new one — so a PR accumulates one live compatibility report
 * across pushes, never a growing thread of stale ones.
 */
import { PR_COMMENT_MARKER } from '@compass/reporting';
import type { IssueCommentsClient } from './issue-comments-client.js';

export interface PostCompatibilityCommentInput {
  readonly owner: string;
  readonly repo: string;
  readonly pullNumber: number;
  readonly markdown: string;
}

export async function postCompatibilityComment(
  client: IssueCommentsClient,
  input: PostCompatibilityCommentInput,
): Promise<{ commentId: number; action: 'created' | 'updated' }> {
  const existingComments = await client.list(input.owner, input.repo, input.pullNumber);
  const existing = existingComments.find((comment) => comment.body.includes(PR_COMMENT_MARKER));

  if (existing) {
    const updated = await client.update(input.owner, input.repo, existing.id, input.markdown);
    return { commentId: updated.id, action: 'updated' };
  }

  const created = await client.create(input.owner, input.repo, input.pullNumber, input.markdown);
  return { commentId: created.id, action: 'created' };
}
