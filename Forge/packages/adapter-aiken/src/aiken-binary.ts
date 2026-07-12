import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

export interface AikenRunResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

let cachedBinaryPath: string | undefined;

/**
 * Resolves the real Aiken compiler binary shipped by @aiken-lang/aiken,
 * without relying on PATH — the npm package's postinstall step downloads
 * the correct platform binary and exposes it through a small Node launcher
 * script named in its own package.json "bin" field.
 */
export async function resolveAikenBinaryPath(): Promise<string> {
  if (cachedBinaryPath) {
    return cachedBinaryPath;
  }

  const require = createRequire(import.meta.url);
  const packageJsonPath = require.resolve("@aiken-lang/aiken/package.json");
  const packageDir = dirname(packageJsonPath);
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    bin?: string | Readonly<Record<string, string>>;
  };

  const relativeBinPath =
    typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.aiken;
  if (!relativeBinPath) {
    throw new Error('@aiken-lang/aiken package.json has no usable "bin" entry');
  }

  cachedBinaryPath = join(packageDir, relativeBinPath);
  return cachedBinaryPath;
}

/**
 * Runs the Aiken CLI and always resolves with its exit code rather than
 * rejecting on a non-zero one — `aiken check` legitimately exits 1 when
 * tests fail while still printing a valid JSON report callers need to
 * parse.
 */
export async function runAiken(args: readonly string[], cwd: string): Promise<AikenRunResult> {
  const binaryPath = await resolveAikenBinaryPath();

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [binaryPath, ...args], { cwd });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode ?? 1 });
    });
  });
}
