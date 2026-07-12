import type { TestResult, TestScenario } from "@forge/domain";
import type { Logger } from "@forge/plugin-api";
import { describe, expect, it, vi } from "vitest";
import type { IAikenCompilerPort } from "../ports/aiken-compiler.port.js";
import type { IEmulatorPort } from "../ports/emulator.port.js";
import { PlatformRegistry } from "../registry/platform-registry.js";
import { RunTestsUseCase } from "./run-tests.use-case.js";

function createSilentLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe("RunTestsUseCase", () => {
  it("merges native Aiken results and emulator scenario results into one report", async () => {
    const nativeResults: TestResult[] = [
      { name: "unit: no double satisfaction", kind: "unit", passed: true, durationMs: 4 },
    ];
    const scenario: TestScenario = {
      name: "happy path",
      kind: "functional",
      description: "beneficiary claims after milestone",
    };
    const scenarioResult: TestResult = {
      name: scenario.name,
      kind: "functional",
      passed: true,
      durationMs: 10,
    };

    const aikenCompiler: IAikenCompilerPort = {
      ensureProject: vi.fn(),
      build: vi.fn(),
      test: vi.fn().mockResolvedValue(nativeResults),
    };
    const emulator: IEmulatorPort = {
      seed: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockResolvedValue(scenarioResult),
    };
    const registry = new PlatformRegistry(createSilentLogger());
    const hookEvents: string[] = [];
    registry.onHook("beforeTest", () => {
      hookEvents.push("before");
    });
    registry.onHook("afterTest", ({ report }) => {
      hookEvents.push(`after:${report.passedCount}`);
    });

    const useCase = new RunTestsUseCase(aikenCompiler, emulator, registry);
    const project = { name: "escrow-demo", rootDir: "/tmp/escrow-demo" };
    const report = await useCase.execute({ project, wallets: [], scenarios: [scenario] });

    expect(emulator.seed).toHaveBeenCalledWith([]);
    expect(emulator.run).toHaveBeenCalledWith(scenario);
    expect(report.passedCount).toBe(2);
    expect(report.failedCount).toBe(0);
    expect(hookEvents).toEqual(["before", "after:2"]);
  });
});
