import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { IAikenCompilerPort } from "@forge/application";
import type { Blueprint, TestResult } from "@forge/domain";
import { runAiken } from "./aiken-binary.js";
import { buildAikenToml } from "./aiken-toml.js";
import { parseBlueprint } from "./blueprint-parser.js";
import { parseTestReport } from "./test-report-parser.js";

export class AikenCompilerAdapter implements IAikenCompilerPort {
  private cachedCompilerVersion: string | undefined;

  async ensureProject(projectRoot: string, packageName: string): Promise<void> {
    await mkdir(join(projectRoot, "validators"), { recursive: true });

    const tomlPath = join(projectRoot, "aiken.toml");
    if (await this.fileExists(tomlPath)) {
      return;
    }

    const compilerVersion = await this.resolveCompilerVersion();
    await writeFile(tomlPath, buildAikenToml(packageName, compilerVersion), "utf8");
  }

  async build(projectRoot: string): Promise<Blueprint> {
    const result = await runAiken(["build"], projectRoot);
    if (result.exitCode !== 0) {
      throw new Error(`aiken build failed:\n${result.stderr || result.stdout}`);
    }
    const rawBlueprint = await readFile(join(projectRoot, "plutus.json"), "utf8");
    return parseBlueprint(rawBlueprint);
  }

  async test(projectRoot: string): Promise<readonly TestResult[]> {
    const startedAt = performance.now();
    const result = await runAiken(["check"], projectRoot);
    const elapsedMs = performance.now() - startedAt;

    if (result.exitCode !== 0 && !result.stdout.includes("{")) {
      throw new Error(`aiken check failed:\n${result.stderr || result.stdout}`);
    }
    return parseTestReport(result.stdout, elapsedMs);
  }

  private async resolveCompilerVersion(): Promise<string> {
    if (this.cachedCompilerVersion) {
      return this.cachedCompilerVersion;
    }
    const result = await runAiken(["--version"], process.cwd());
    const match = /aiken (\S+)/.exec(result.stdout);
    const version = match?.[1];
    if (!version) {
      throw new Error(`could not determine Aiken compiler version from: ${result.stdout}`);
    }
    this.cachedCompilerVersion = version;
    return version;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}
