#!/usr/bin/env node
/**
 * The real Node entrypoint `action.yml` points at — reads the standard
 * GitHub Actions input/event contract and calls `run()`. Everything here
 * is I/O and environment plumbing; `run()` (run.ts) holds the actual
 * orchestration and is what this package's tests exercise directly.
 */
import { appendFileSync, readFileSync } from 'node:fs';
import { createActionRuntime } from './composition-root.js';
import { resolveActionContext } from './action-context.js';
import { RestIssueCommentsClient } from './issue-comments-client.js';
import { run } from './run.js';

/** Matches the real GitHub Actions input convention: `INPUT_<NAME>`, spaces to underscores, uppercased — hyphens are left as-is. */
function readActionInput(name: string): string | undefined {
  const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  const value = process.env[key];
  return value && value.trim() !== '' ? value : undefined;
}

/** Writes to the modern `GITHUB_OUTPUT` file convention (the `::set-output::` command it replaced is deprecated); a no-op outside a real Actions runner. */
function writeActionOutput(name: string, value: string): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  appendFileSync(outputPath, `${name}=${value}\n`, 'utf8');
}

function readEventPayload(): unknown {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return undefined;
  try {
    return JSON.parse(readFileSync(eventPath, 'utf8'));
  } catch {
    return undefined;
  }
}

async function main(): Promise<number> {
  const token = readActionInput('github-token');
  if (!token) {
    console.error('forge-midnight action: missing required input "github-token".');
    return 2;
  }

  const context = resolveActionContext(process.env, readEventPayload());
  if (!context) {
    console.log('forge-midnight action: not a pull_request event — nothing to do.');
    return 0;
  }

  const runtime = createActionRuntime({ dbPath: readActionInput('db-path'), githubToken: token });
  const issueComments = new RestIssueCommentsClient(token);
  const result = await run({ runtime, issueComments, context });

  writeActionOutput('has-incompatibility', result.hasIncompatibility ? 'true' : 'false');
  console.log(`forge-midnight action: ${result.commentAction} PR comment #${result.commentId}.`);
  return result.hasIncompatibility ? 1 : 0;
}

process.exitCode = await main();
