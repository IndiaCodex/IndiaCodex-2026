import type { Blueprint, Project, TestResult } from "@forge/domain";

export interface CommandDefinition {
  readonly name: string;
  readonly description: string;
  readonly execute: (args: readonly string[]) => Promise<void>;
}

export interface GeneratorContext {
  readonly project: Project;
  readonly blueprint: Blueprint;
}

export interface GeneratorDefinition {
  readonly name: string;
  readonly description: string;
  readonly generate: (context: GeneratorContext) => Promise<readonly TestResult[]>;
}
