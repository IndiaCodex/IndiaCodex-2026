import { describe, expect, it } from 'vitest';
import { runDashboard } from '../src/commands/dashboard.js';
import { buildTestEcosystem } from './test-ecosystem.js';

describe('runDashboard', () => {
  it('ingests a fresh snapshot and renders a self-contained HTML dashboard', async () => {
    const { runtimeV1 } = buildTestEcosystem();

    const result = await runDashboard(runtimeV1);

    expect(result.exitCode).toBe(0);
    expect(result.output.startsWith('<!doctype html>')).toBe(true);
    expect(result.output).toContain('Compass — Ecosystem Dashboard');
    expect(result.output).toContain('app-a');
    expect(result.output).toContain('lib-b');
  });
});
