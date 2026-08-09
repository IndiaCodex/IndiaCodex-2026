import type { Blueprint, Project, TestReport, TestResult } from "@forge/domain";
import { summarizeTestResults } from "@forge/domain";
import type { PlatformRegistry } from "../registry/platform-registry.js";

/**
 * Runs every generator a plugin has registered (built-in ai-testgen or a
 * third party) against the compiled blueprint. With no generators
 * registered yet, this correctly produces an empty, passing report — it
 * does not fabricate findings.
 */
export class GenerateSecurityTestsUseCase {
  constructor(private readonly registry: PlatformRegistry) {}

  async execute(project: Project, blueprint: Blueprint): Promise<TestReport> {
    const results: TestResult[] = [];
    for (const generator of this.registry.getGenerators()) {
      const generated = await generator.generate({ project, blueprint });
      results.push(...generated);
    }
    return summarizeTestResults(results);
  }
}
