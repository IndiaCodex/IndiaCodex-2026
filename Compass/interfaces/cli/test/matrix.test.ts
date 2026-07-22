import { describe, expect, it } from 'vitest';
import { runMatrix } from '../src/commands/matrix.js';
import { APP_COMPONENT, buildTestEcosystem, LATER, LIB_COMPONENT } from './test-ecosystem.js';

describe('runMatrix', () => {
  it('renders a compatible relationship as markdown by default with exit code 0', async () => {
    const { runtimeV1 } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();

    const result = await runMatrix(runtimeV1, { format: 'markdown' });

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('| Component | Depends on | Status | Relationships |');
    expect(result.output).toContain('✅ Compatible');
  });

  it('renders html when requested', async () => {
    const { runtimeV1 } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();

    const result = await runMatrix(runtimeV1, { format: 'html' });

    expect(result.output).toContain('<table class="compatibility-matrix">');
  });

  it('reports exit code 1 when the matrix contains an incompatible relationship', async () => {
    const { runtimeV1, runtimeV2, clock } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();
    clock.advanceTo(LATER);
    await runtimeV2.ingestSnapshot.execute();

    const result = await runMatrix(runtimeV1, { format: 'markdown' });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('❌ Incompatible');
  });

  it('restricts the matrix to the given component ids', async () => {
    const { runtimeV1 } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();

    const result = await runMatrix(runtimeV1, { format: 'markdown', componentIds: [APP_COMPONENT.id, LIB_COMPONENT.id] });

    expect(result.output).toContain('| Component | Depends on | Status | Relationships |');
  });
});
