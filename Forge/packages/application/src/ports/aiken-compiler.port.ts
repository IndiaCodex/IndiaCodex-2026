import type { Blueprint, TestResult } from "@forge/domain";
import { createPortToken } from "@forge/plugin-api";
import type { PortToken } from "@forge/plugin-api";

export interface IAikenCompilerPort {
  /**
   * Ensures `projectRoot` is a buildable Aiken project (writes `aiken.toml`
   * and any other scaffolding the compiler needs), creating it if absent.
   * Idempotent — safe to call before every build.
   */
  ensureProject(projectRoot: string, packageName: string): Promise<void>;
  build(projectRoot: string): Promise<Blueprint>;
  test(projectRoot: string): Promise<readonly TestResult[]>;
}

export const IAikenCompilerPortToken: PortToken<IAikenCompilerPort> =
  createPortToken<IAikenCompilerPort>("IAikenCompilerPort");
