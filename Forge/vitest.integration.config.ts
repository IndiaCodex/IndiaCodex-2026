import { defineConfig } from "vitest/config";

/**
 * Integration tests exercise real external tools (the actual Aiken
 * compiler binary, real network access to fetch stdlib) and are
 * deliberately kept out of the default `pnpm test` run — they are slower
 * and, unlike the rest of the suite, not fully hermetic. Run explicitly
 * via `pnpm test:integration`.
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    passWithNoTests: true,
    include: ["packages/*/src/**/*.integration.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
