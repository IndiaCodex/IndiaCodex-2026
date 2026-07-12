import { describe, expect, it } from "vitest";
import { parseTestReport, TestReportParseError } from "./test-report-parser.js";

// Captured verbatim from a real `aiken check` run (Aiken v1.1.23), including
// the human-readable progress lines Aiken prints before the JSON report.
const REAL_AIKEN_CHECK_STDOUT = `    Compiling test-org/escrow-demo 0.0.0 (.)
    Compiling aiken-lang/stdlib v3.1.0 (./build/packages/aiken-lang-stdlib)
   Collecting all tests scenarios across all modules
      Testing ...
${JSON.stringify({
  seed: 4116486127,
  summary: { total: 2, passed: 1, failed: 1, kind: { unit: 2, property: 0 } },
  modules: [
    {
      name: "escrow_milestone_tests",
      summary: { total: 2, passed: 1, failed: 1, kind: { unit: 2, property: 0 } },
      tests: [
        {
          title: "example_pass",
          status: "pass",
          on_failure: "fail_immediately",
          execution_units: { mem: 200, cpu: 16100 },
        },
        {
          title: "example_fail",
          status: "fail",
          on_failure: "fail_immediately",
          execution_units: { mem: 200, cpu: 16100 },
          assertion: "× expected\n│ 2\n× to equal\n│ 3",
        },
      ],
    },
  ],
})}`;

describe("parseTestReport", () => {
  it("parses real aiken check stdout into TestResult entries", () => {
    const results = parseTestReport(REAL_AIKEN_CHECK_STDOUT, 100);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ name: "example_pass", passed: true, kind: "unit" });
    expect(results[1]).toMatchObject({ name: "example_fail", passed: false });
  });

  it("carries the failure assertion through as the result message", () => {
    const results = parseTestReport(REAL_AIKEN_CHECK_STDOUT, 100);

    expect(results[1]?.message).toContain("expected");
  });

  it("distributes the total measured duration evenly across tests", () => {
    const results = parseTestReport(REAL_AIKEN_CHECK_STDOUT, 100);

    expect(results[0]?.durationMs).toBe(50);
    expect(results[1]?.durationMs).toBe(50);
  });

  it("returns an empty array when there are no tests", () => {
    const noTests = `{"seed":1,"summary":{"total":0,"passed":0,"failed":0,"kind":{"unit":0,"property":0}},"modules":[]}`;

    expect(parseTestReport(noTests, 50)).toEqual([]);
  });

  it("throws TestReportParseError when no JSON is present", () => {
    expect(() => parseTestReport("no json here at all", 10)).toThrow(TestReportParseError);
  });
});
