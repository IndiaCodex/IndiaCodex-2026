export type TestKind = "unit" | "property" | "integration" | "security" | "functional";

export interface TestScenario {
  readonly name: string;
  readonly kind: TestKind;
  readonly description: string;
}

export interface TestResult {
  readonly name: string;
  readonly kind: TestKind;
  readonly passed: boolean;
  readonly durationMs: number;
  readonly message?: string;
}

export interface TestReport {
  readonly results: readonly TestResult[];
  readonly passedCount: number;
  readonly failedCount: number;
}

export function summarizeTestResults(results: readonly TestResult[]): TestReport {
  const passedCount = results.filter((result) => result.passed).length;
  return {
    results,
    passedCount,
    failedCount: results.length - passedCount,
  };
}
