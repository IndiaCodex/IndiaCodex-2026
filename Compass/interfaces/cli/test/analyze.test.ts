import { describe, expect, it } from 'vitest';
import { runAnalyze } from '../src/commands/analyze.js';
import { buildTestEcosystem, LIB_RELEASE_2 } from './test-ecosystem.js';

describe('runAnalyze', () => {
  it('ingests a fresh snapshot and summarizes components, releases, and risk', async () => {
    const { runtimeV1 } = buildTestEcosystem();

    const result = await runAnalyze(runtimeV1);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('Repositories:               2');
    expect(result.output).toContain('Components:                 2');
    expect(result.output).toContain('Releases:                   2');
    expect(result.output).toContain('org/app-a');
    expect(result.output).toContain('org/lib-b');
    expect(result.output).toContain(LIB_RELEASE_2);
    expect(result.output).toContain('Ecosystem risk:');
  });
});
