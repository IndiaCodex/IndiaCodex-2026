import type { IssueComment, IssueCommentsClient } from '../src/issue-comments-client.js';

/** An in-memory fake satisfying IssueCommentsClient — this package's equivalent of `@compass/testing`'s fakes, kept local since it's specific to this one port. */
export class FakeIssueCommentsClient implements IssueCommentsClient {
  private nextId = 1;
  public readonly comments: IssueComment[] = [];
  public readonly updates: IssueComment[] = [];

  public constructor(seed: readonly IssueComment[] = []) {
    this.comments.push(...seed);
    this.nextId = seed.reduce((max, comment) => Math.max(max, comment.id), 0) + 1;
  }

  public list(): Promise<readonly IssueComment[]> {
    return Promise.resolve([...this.comments]);
  }

  public create(_owner: string, _repo: string, _issueNumber: number, body: string): Promise<IssueComment> {
    const comment: IssueComment = { id: this.nextId++, body };
    this.comments.push(comment);
    return Promise.resolve(comment);
  }

  public update(_owner: string, _repo: string, commentId: number, body: string): Promise<IssueComment> {
    const index = this.comments.findIndex((comment) => comment.id === commentId);
    if (index === -1) throw new Error(`No such comment: ${commentId}`);
    const updated: IssueComment = { id: commentId, body };
    this.comments[index] = updated;
    this.updates.push(updated);
    return Promise.resolve(updated);
  }
}
