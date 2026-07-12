import type { Network } from "@forge/domain";

export interface ParsedBuildArgs {
  readonly description: string;
  readonly name?: string;
  readonly network: Network;
  readonly minConfidence?: number;
}

const VALID_NETWORKS: readonly Network[] = ["emulator", "preview", "preprod", "mainnet"];

export const USAGE =
  'Usage: forge build "<description>" [--name <project-name>] [--network <network>] [--min-confidence <0-1>]';

export class InvalidBuildArgsError extends Error {}

export function parseBuildArgs(args: readonly string[]): ParsedBuildArgs {
  const [description, ...rest] = args;
  if (!description) {
    throw new InvalidBuildArgsError(USAGE);
  }

  let name: string | undefined;
  let network: Network = "preview";
  let minConfidence: number | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    const value = rest[index + 1];

    if (flag === "--name" && value) {
      name = value;
      index += 1;
    } else if (flag === "--network" && value) {
      if (!VALID_NETWORKS.includes(value as Network)) {
        throw new InvalidBuildArgsError(
          `Unknown network "${value}". Expected one of: ${VALID_NETWORKS.join(", ")}`,
        );
      }
      network = value as Network;
      index += 1;
    } else if (flag === "--min-confidence" && value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
        throw new InvalidBuildArgsError(
          `Invalid --min-confidence "${value}". Expected a number between 0 and 1.`,
        );
      }
      minConfidence = parsed;
      index += 1;
    }
  }

  return { description, name, network, minConfidence };
}
