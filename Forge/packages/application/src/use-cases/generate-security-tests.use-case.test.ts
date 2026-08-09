import type { Blueprint, TestResult } from "@forge/domain";
import type { Logger } from "@forge/plugin-api";
import { describe, expect, it, vi } from "vitest";
import { PlatformRegistry } from "../registry/platform-registry.js";
import { GenerateSecurityTestsUseCase } from "./generate-security-tests.use-case.js";

function createSilentLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

const project = { name: "escrow-demo", rootDir: "/tmp/escrow-demo" };
const blueprint: Blueprint = {
  preamble: { title: "escrow", version: "1.0.0", plutusVersion: "v3" },
  validators: [],
  definitions: {},
};

describe("GenerateSecurityTestsUseCase", () => {
  it("aggregates results from every registered generator", async () => {
    const registry = new PlatformRegistry(createSilentLogger());
    const doubleSatisfactionResult: TestResult = {
      name: "no double satisfaction",
      kind: "security",
      passed: false,
      durationMs: 3,
    };
    const missingSignerResult: TestResult = {
      name: "requires beneficiary signature",
      kind: "security",
      passed: true,
      durationMs: 2,
    };

    registry.registerGenerator({
      name: "double-satisfaction-rule",
      description: "checks for shared validator addresses",
      generate: vi.fn().mockResolvedValue([doubleSatisfactionResult]),
    });
    registry.registerGenerator({
      name: "missing-signer-rule",
      description: "checks for a required signer",
      generate: vi.fn().mockResolvedValue([missingSignerResult]),
    });

    const useCase = new GenerateSecurityTestsUseCase(registry);
    const report = await useCase.execute(project, blueprint);

    expect(report.results).toHaveLength(2);
    expect(report.passedCount).toBe(1);
    expect(report.failedCount).toBe(1);
  });

  it("returns an empty, passing report when no generators are registered", async () => {
    const registry = new PlatformRegistry(createSilentLogger());
    const useCase = new GenerateSecurityTestsUseCase(registry);

    const report = await useCase.execute(project, blueprint);

    expect(report.results).toHaveLength(0);
    expect(report.passedCount).toBe(0);
    expect(report.failedCount).toBe(0);
  });
});
