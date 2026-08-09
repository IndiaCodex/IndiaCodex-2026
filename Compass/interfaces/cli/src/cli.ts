/**
 * The `forge-midnight` CLI shell: argument parsing, dispatch, printing, and
 * exit-code mapping only — every command function it calls already returns
 * its rendered output and the exit code it warrants
 * (docs/architecture/interfaces.md#cli).
 */
import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import type { CompassRuntime, CompassRuntimeOptions } from './composition-root.js';
import { CliToolError } from './errors.js';
import type { CommandResult } from './commands/command-result.js';
import { runAnalyze } from './commands/analyze.js';
import { runBreakingChanges } from './commands/breaking-changes.js';
import { runCompatibility } from './commands/compatibility.js';
import { runDashboard } from './commands/dashboard.js';
import { runGraph } from './commands/graph.js';
import { runMatrix } from './commands/matrix.js';

/** Right-pads to a fixed column, always leaving at least one separating space, so help text stays aligned regardless of how long a label is — a hand-typed space count silently breaks the moment a longer command name is added. */
function padLabel(label: string, width: number): string {
  return label.padEnd(Math.max(width, label.length + 1));
}

const COMMAND_COLUMN = 18;
const COMMANDS: readonly (readonly [string, string])[] = [
  ['analyze', 'Ingest a fresh snapshot from the real Midnight ecosystem and summarize it.'],
  ['matrix', 'Render the Compatibility Matrix.'],
  ['graph', 'Render the dependency graph.'],
  ['compatibility', 'Evaluate whether an upgrade is safe (Upgrade Advisor).'],
  ['breaking-changes', "Compare a component's release across two persisted snapshots."],
  ['dashboard', 'Generate the static HTML ecosystem dashboard.'],
];

const USAGE = `forge-midnight <command> [options]

Commands:
${COMMANDS.map(([name, description]) => `  ${padLabel(name, COMMAND_COLUMN)}${description}`).join('\n')}

Global options:
  --db <path>       Persist/read snapshot history via SQLite instead of an ephemeral in-memory store.
  --token <token>   GitHub personal access token (raises the unauthenticated API rate limit).
  --out <path>      Write output to a file instead of stdout.
  --help            Show this message.

Command-specific options:
${(
  [
    ['matrix', '--format <markdown|html>   (default: markdown)'],
    ['', '--component <id>           (repeatable; restricts the matrix to these components)'],
    ['graph', '--format <mermaid|text>    (default: mermaid)'],
    ['compatibility', '--target <releaseId>       (required)'],
    ['', "--component <id>           (the upgrade's subject component)"],
    ['', '--stack <releaseId>        (repeatable; the rest of the current stack)'],
    ['breaking-changes', '--component <id> --from <snapshotId> --to <snapshotId>   (all required; needs --db)'],
  ] satisfies (readonly [string, string])[]
)
  .map(([label, option]) => `  ${padLabel(label, COMMAND_COLUMN)}${option}`)
  .join('\n')}

Examples:
  forge-midnight analyze
  forge-midnight matrix --format html --out matrix.html
  forge-midnight compatibility --target midnightntwrk/midnight-js@5.0.0-beta.6 --component midnightntwrk/example-counter --stack midnightntwrk/example-counter@1.0.0
  forge-midnight dashboard --out dashboard.html
`;

export interface CliIo {
  readonly print: (text: string) => void;
  readonly printError: (text: string) => void;
}

export const stdIo: CliIo = {
  print: (text) => process.stdout.write(`${text}\n`),
  printError: (text) => process.stderr.write(`${text}\n`),
};

export type RuntimeFactory = (options: CompassRuntimeOptions) => CompassRuntime;

const CLI_OPTIONS = {
  db: { type: 'string' },
  token: { type: 'string' },
  out: { type: 'string' },
  format: { type: 'string' },
  component: { type: 'string', multiple: true },
  stack: { type: 'string', multiple: true },
  target: { type: 'string' },
  from: { type: 'string' },
  to: { type: 'string' },
  help: { type: 'boolean' },
} as const;

function parseGlobalAndCommandArgs(
  argv: readonly string[],
): ReturnType<typeof parseArgs<{ args: string[]; allowPositionals: true; options: typeof CLI_OPTIONS }>> {
  return parseArgs({ args: [...argv], allowPositionals: true, options: CLI_OPTIONS });
}

export async function runCli(argv: readonly string[], io: CliIo, createRuntime: RuntimeFactory): Promise<number> {
  let parsed;
  try {
    parsed = parseGlobalAndCommandArgs(argv);
  } catch (error) {
    io.printError(error instanceof Error ? error.message : String(error));
    io.printError(USAGE);
    return 2;
  }

  const { values, positionals } = parsed;
  const [command] = positionals;

  if (values.help || !command) {
    io.print(USAGE);
    return values.help ? 0 : 2;
  }

  const runtime = createRuntime({ dbPath: values.db, githubToken: values.token });

  try {
    const result = await dispatch(command, runtime, values);

    if (values.out) {
      writeFileSync(values.out, result.output, 'utf8');
    } else {
      io.print(result.output);
    }

    return result.exitCode;
  } catch (error) {
    if (error instanceof CliToolError) {
      io.printError(`Error: ${error.message}`);
      return 2;
    }
    io.printError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }
}

async function dispatch(
  command: string,
  runtime: CompassRuntime,
  values: {
    format?: string;
    component?: readonly string[];
    stack?: readonly string[];
    target?: string;
    from?: string;
    to?: string;
  },
): Promise<CommandResult> {
  switch (command) {
    case 'analyze':
      return runAnalyze(runtime);

    case 'matrix':
      return runMatrix(runtime, {
        format: values.format === 'html' ? 'html' : 'markdown',
        componentIds: values.component,
      });

    case 'graph':
      return runGraph(runtime, { format: values.format === 'text' ? 'text' : 'mermaid' });

    case 'compatibility':
      if (!values.target) throw new CliToolError('compatibility requires --target <releaseId>.');
      return runCompatibility(runtime, {
        targetReleaseId: values.target,
        subjectComponentId: values.component?.[0],
        stackReleaseIds: values.stack,
      });

    case 'breaking-changes':
      if (!values.component?.[0] || !values.from || !values.to) {
        throw new CliToolError('breaking-changes requires --component <id>, --from <snapshotId>, and --to <snapshotId>.');
      }
      return runBreakingChanges(runtime, {
        componentId: values.component[0],
        fromSnapshotId: values.from,
        toSnapshotId: values.to,
      });

    case 'dashboard':
      return runDashboard(runtime);

    default:
      throw new CliToolError(`Unknown command "${command}". Run with --help to see available commands.`);
  }
}
