import { describe, expect, it } from 'vitest';
import { runBreakingChanges } from '../src/commands/breaking-changes.js';
import { CliToolError } from '../src/errors.js';
import { buildTestEcosystem, LATER, LIB_COMPONENT } from './test-ecosystem.js';

describe('runBreakingChanges', () => {
  it('reports the capability removed between two persisted snapshots, with exit code 1', async () => {
    const { runtimeV1, runtimeV2, clock, ids } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();
    clock.advanceTo(LATER);
    await runtimeV2.ingestSnapshot.execute();

    // The shared SequentialIdGenerator hands out "snapshot-1" then "snapshot-2", in ingestion order.
    void ids;
    const result = await runBreakingChanges(runtimeV1, {
      componentId: LIB_COMPONENT.id,
      fromSnapshotId: 'snapshot-1',
      toSnapshotId: 'snapshot-2',
    });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('### Breaking Change Report: lib-b');
    expect(result.output).toContain('legacy-witness');
    expect(result.output).toContain('**Removed capabilities**');
  });

  it('throws a CliToolError when a required option is missing', async () => {
    const { runtimeV1 } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();

    await expect(
      runBreakingChanges(runtimeV1, { componentId: '', fromSnapshotId: 'snapshot-1', toSnapshotId: 'snapshot-2' }),
    ).rejects.toBeInstanceOf(CliToolError);
  });

  it('throws a CliToolError when the "to" snapshot does not exist', async () => {
    const { runtimeV1 } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();

    await expect(
      runBreakingChanges(runtimeV1, {
        componentId: LIB_COMPONENT.id,
        fromSnapshotId: 'snapshot-1',
        toSnapshotId: 'does-not-exist',
      }),
    ).rejects.toBeInstanceOf(CliToolError);
  });
});
