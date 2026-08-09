import type { Project, TestReport, TestScenario, Wallet } from "@forge/domain";
import { summarizeTestResults } from "@forge/domain";
import type { IEmulatorPort } from "../ports/emulator.port.js";
import type { IAikenCompilerPort } from "../ports/aiken-compiler.port.js";
import type { PlatformRegistry } from "../registry/platform-registry.js";

export interface RunTestsInput {
  readonly project: Project;
  readonly wallets: readonly Wallet[];
  readonly scenarios: readonly TestScenario[];
}

export class RunTestsUseCase {
  constructor(
    private readonly aikenCompiler: IAikenCompilerPort,
    private readonly emulator: IEmulatorPort,
    private readonly registry: PlatformRegistry,
  ) {}

  async execute(input: RunTestsInput): Promise<TestReport> {
    const { project, wallets, scenarios } = input;
    await this.registry.fireHook("beforeTest", { project });

    const nativeResults = await this.aikenCompiler.test(project.rootDir);

    await this.emulator.seed(wallets);
    const integrationResults = await Promise.all(
      scenarios.map((scenario) => this.emulator.run(scenario)),
    );

    const report = summarizeTestResults([...nativeResults, ...integrationResults]);
    await this.registry.fireHook("afterTest", { project, report });
    return report;
  }
}
