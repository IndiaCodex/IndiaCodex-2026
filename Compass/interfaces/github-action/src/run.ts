/**
 * The Action's driving-adapter orchestration (docs/architecture/interfaces.md#github-action):
 * ingest a fresh snapshot through the same `IngestSnapshotUseCase` the CLI
 * calls, build the Compatibility Matrix, render it with `@compass/reporting`'s
 * `renderPrComment` (the one place a PR comment's shape is assembled, so
 * the CLI and the Action can never render it differently), and post or
 * update the PR's own comment. No compatibility logic lives here.
 */
import { buildCompatibilityMatrixView } from '@compass/domain';
import { renderPrComment } from '@compass/reporting';
import type { ActionRuntime } from './composition-root.js';
import type { ActionContext } from './action-context.js';
import type { IssueCommentsClient } from './issue-comments-client.js';
import { postCompatibilityComment } from './post-compatibility-comment.js';

export interface RunDependencies {
  readonly runtime: ActionRuntime;
  readonly issueComments: IssueCommentsClient;
  readonly context: ActionContext;
}

export interface RunResult {
  readonly hasIncompatibility: boolean;
  readonly commentId: number;
  readonly commentAction: 'created' | 'updated';
}

export async function run(deps: RunDependencies): Promise<RunResult> {
  const snapshot = await deps.runtime.ingestSnapshot.execute();
  const matrix = buildCompatibilityMatrixView(snapshot.compatibilityRelationships, snapshot.releases);

  const { markdown, hasIncompatibility } = renderPrComment({
    components: snapshot.components,
    matrix,
    risks: snapshot.risks,
    generatedAt: snapshot.createdAt,
  });

  const { commentId, action: commentAction } = await postCompatibilityComment(deps.issueComments, {
    owner: deps.context.owner,
    repo: deps.context.repo,
    pullNumber: deps.context.pullNumber,
    markdown,
  });

  return { hasIncompatibility, commentId, commentAction };
}
