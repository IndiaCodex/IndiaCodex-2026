import { describe, expect, it } from 'vitest';
import { resolveActionContext } from '../src/action-context.js';

describe('resolveActionContext', () => {
  it('resolves owner, repo, and pull number from a real pull_request event payload', () => {
    const context = resolveActionContext(
      { GITHUB_REPOSITORY: 'midnightntwrk/midnight-js' },
      { pull_request: { number: 42 } },
    );

    expect(context).toEqual({ owner: 'midnightntwrk', repo: 'midnight-js', pullNumber: 42 });
  });

  it('returns null when GITHUB_REPOSITORY is missing', () => {
    expect(resolveActionContext({}, { pull_request: { number: 1 } })).toBeNull();
  });

  it('returns null when GITHUB_REPOSITORY has no owner/repo separator', () => {
    expect(resolveActionContext({ GITHUB_REPOSITORY: 'not-a-valid-repo-slug' }, { pull_request: { number: 1 } })).toBeNull();
  });

  it('returns null when the event payload has no pull_request (e.g. a push event)', () => {
    expect(resolveActionContext({ GITHUB_REPOSITORY: 'owner/repo' }, { ref: 'refs/heads/main' })).toBeNull();
  });

  it('returns null when the event payload is undefined', () => {
    expect(resolveActionContext({ GITHUB_REPOSITORY: 'owner/repo' }, undefined)).toBeNull();
  });
});
