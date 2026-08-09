/**
 * Resolves which pull request this run is for, from the standard GitHub
 * Actions runtime contract (`GITHUB_REPOSITORY`, `GITHUB_EVENT_PATH`) —
 * no `@actions/github` dependency needed for two environment reads and a
 * JSON parse.
 */
export interface ActionContext {
  readonly owner: string;
  readonly repo: string;
  readonly pullNumber: number;
}

interface PullRequestEventPayload {
  readonly pull_request?: { readonly number: number };
}

/** Null when this run isn't a pull_request event, or the environment is missing what's needed — the entrypoint treats that as a clean no-op, not a failure. */
export function resolveActionContext(
  env: Readonly<Record<string, string | undefined>>,
  eventPayload: unknown,
): ActionContext | null {
  const repository = env.GITHUB_REPOSITORY;
  if (!repository) return null;
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) return null;

  const pullNumber = (eventPayload as PullRequestEventPayload | undefined)?.pull_request?.number;
  if (typeof pullNumber !== 'number') return null;

  return { owner, repo, pullNumber };
}
