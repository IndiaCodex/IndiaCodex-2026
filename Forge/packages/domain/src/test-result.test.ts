import { describe, expect, it } from "vitest";
import { summarizeTestResults } from "./test-result.js";
import type { TestResult } from "./test-result.js";

describe("summarizeTestResults", () => {
  it("counts passed and failed results", () => {
    const results: TestResult[] = [
      { name: "happy path", kind: "functional", passed: true, durationMs: 12 },
      { name: "missing signer check", kind: "security", passed: false, durationMs: 8 },
      { name: "double satisfaction", kind: "security", passed: true, durationMs: 5 },
    ];

    const report = summarizeTestResults(results);

    expect(report.passedCount).toBe(2);
    expect(report.failedCount).toBe(1);
    expect(report.results).toHaveLength(3);
  });

  it("handles an empty result set", () => {
    const report = summarizeTestResults([]);

    expect(report.passedCount).toBe(0);
    expect(report.failedCount).toBe(0);
  });
});
