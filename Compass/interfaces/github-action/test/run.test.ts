import { describe, expect, it } from 'vitest';
import { run } from '../src/run.js';
import { FakeIssueCommentsClient } from './fake-issue-comments-client.js';
import { buildCompatibleActionRuntime, buildIncompatibleActionRuntime } from './test-ecosystem.js';

const CONTEXT = { owner: 'midnightntwrk', repo: 'midnight-js', pullNumber: 42 };

describe('run', () => {
  it('ingests, renders, and creates a PR comment reporting no incompatibility', async () => {
    const runtime = buildCompatibleActionRuntime();
    const issueComments = new FakeIssueCommentsClient();

    const result = await run({ runtime, issueComments, context: CONTEXT });

    expect(result.hasIncompatibility).toBe(false);
    expect(result.commentAction).toBe('created');
    expect(issueComments.comments).toHaveLength(1);
    expect(issueComments.comments[0]?.body).toContain('No known incompatibilities');
  });

  it('reports hasIncompatibility and includes it in the posted comment when a relationship is incompatible', async () => {
    const runtime = buildIncompatibleActionRuntime();
    const issueComments = new FakeIssueCommentsClient();

    const result = await run({ runtime, issueComments, context: CONTEXT });

    expect(result.hasIncompatibility).toBe(true);
    expect(issueComments.comments[0]?.body).toContain('Incompatibilities found');
    expect(issueComments.comments[0]?.body).toContain('app-a');
    expect(issueComments.comments[0]?.body).toContain('lib-b');
  });

  it('updates its own prior comment on a second run instead of posting a duplicate', async () => {
    const runtime = buildCompatibleActionRuntime();
    const issueComments = new FakeIssueCommentsClient();

    await run({ runtime, issueComments, context: CONTEXT });
    const second = await run({ runtime, issueComments, context: CONTEXT });

    expect(second.commentAction).toBe('updated');
    expect(issueComments.comments).toHaveLength(1);
  });
});
