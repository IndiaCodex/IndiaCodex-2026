import { describe, expect, it } from 'vitest';
import { runGraph } from '../src/commands/graph.js';
import { buildTestEcosystem } from './test-ecosystem.js';

describe('runGraph', () => {
  it('renders a Mermaid graph by default', async () => {
    const { runtimeV1 } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();

    const result = await runGraph(runtimeV1, { format: 'mermaid' });

    expect(result.exitCode).toBe(0);
    expect(result.output.startsWith('graph LR')).toBe(true);
    expect(result.output).toMatch(/-->/);
  });

  it('renders plain text when requested', async () => {
    const { runtimeV1 } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();

    const result = await runGraph(runtimeV1, { format: 'text' });

    expect(result.output).toContain('app-a -> lib-b');
  });
});
