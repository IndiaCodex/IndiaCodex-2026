import { buildCommand } from "./commands/build.js";
import { USAGE } from "./parse-build-args.js";

export class UnknownCommandError extends Error {}

export async function runCli(args: readonly string[]): Promise<void> {
  const [command, ...rest] = args;

  if (command === "build") {
    await buildCommand(rest);
    return;
  }

  printUsage();
  if (command !== undefined) {
    throw new UnknownCommandError(`Unknown command: "${command}"`);
  }
}

function printUsage(): void {
  console.log(USAGE);
}
