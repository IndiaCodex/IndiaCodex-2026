import { defineConfig } from "vitest/config";

/**
 * Every package's vitest.config.ts was identical except for `test.name` —
 * nine copies of the same four lines. One factory, one place to change
 * the shared test environment/include pattern for the whole workspace.
 */
export function createVitestConfig(name: string) {
  return defineConfig({
    test: {
      name,
      environment: "node",
      include: ["test/**/*.test.ts"],
    },
  });
}
