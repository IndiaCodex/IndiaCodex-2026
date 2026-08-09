import type { TestResult } from "@forge/domain";
import { asRecord } from "./json-helpers.js";

export class TestReportParseError extends Error {
  constructor(message: string) {
    super(`Failed to parse aiken check output: ${message}`);
    this.name = "TestReportParseError";
  }
}

/**
 * `aiken check` prints human-readable progress lines before the JSON test
 * report, so we parse from the first '{' rather than the whole stdout.
 * Aiken does not report per-test wall-clock duration (only CPU/memory
 * execution units), so `totalDurationMs` — measured by the caller around
 * the whole process invocation — is spread evenly across the tests found
 * as a transparent approximation, not a fabricated per-test timing.
 */
export function parseTestReport(rawStdout: string, totalDurationMs: number): readonly TestResult[] {
  const jsonStart = rawStdout.indexOf("{");
  if (jsonStart === -1) {
    throw new TestReportParseError("no JSON object found in output");
  }

  try {
    const parsed: unknown = JSON.parse(rawStdout.slice(jsonStart));
    const { modules } = asRecord(parsed, "the test report");
    if (!Array.isArray(modules)) {
      throw new Error("missing modules array");
    }

    const results: Array<{ name: string; passed: boolean; message?: string }> = [];
    for (const moduleRaw of modules) {
      const { tests } = asRecord(moduleRaw, "a test module");
      if (!Array.isArray(tests)) {
        continue;
      }
      for (const testRaw of tests) {
        const { title, status, assertion } = asRecord(testRaw, "a test");
        if (typeof title !== "string" || typeof status !== "string") {
          throw new Error("test entry is missing a title or status");
        }
        results.push({
          name: title,
          passed: status === "pass",
          message: typeof assertion === "string" ? assertion : undefined,
        });
      }
    }

    const perTestDurationMs = results.length > 0 ? totalDurationMs / results.length : 0;
    return results.map((result) => ({
      name: result.name,
      kind: "unit",
      passed: result.passed,
      durationMs: perTestDurationMs,
      message: result.message,
    }));
  } catch (cause) {
    throw new TestReportParseError((cause as Error).message);
  }
}
