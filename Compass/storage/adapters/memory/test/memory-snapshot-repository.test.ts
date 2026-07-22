import { describe, expect, it } from 'vitest';
import { createEmptySnapshot, toSnapshotId, toTimestamp } from '@compass/domain';
import { checkSnapshotRepositoryConformance } from '@compass/storage-sdk';
import { MemorySnapshotRepository } from '../src/index.js';

describe('MemorySnapshotRepository', () => {
  it('passes the shared SnapshotRepositoryPort conformance suite', async () => {
    const violations = await checkSnapshotRepositoryConformance(new MemorySnapshotRepository());
    expect(violations).toEqual([]);
  });

  it('starts empty', async () => {
    const repo = new MemorySnapshotRepository();
    expect(await repo.getLatest()).toBeNull();
    expect(await repo.list()).toEqual([]);
  });

  it('save() is idempotent for the same snapshot id — a second save overwrites, not duplicates', async () => {
    const repo = new MemorySnapshotRepository();
    const snapshot = createEmptySnapshot(toSnapshotId('snap-1'), toTimestamp('2026-01-01T00:00:00.000Z'));
    await repo.save(snapshot);
    await repo.save(snapshot);
    expect(await repo.list()).toHaveLength(1);
  });

  it('clear() empties the repository', async () => {
    const repo = new MemorySnapshotRepository();
    await repo.save(createEmptySnapshot(toSnapshotId('snap-1'), toTimestamp('2026-01-01T00:00:00.000Z')));
    repo.clear();
    expect(await repo.getLatest()).toBeNull();
    expect(await repo.list()).toEqual([]);
  });

  it('getById returns null for an id that was never saved', async () => {
    const repo = new MemorySnapshotRepository();
    expect(await repo.getById(toSnapshotId('missing'))).toBeNull();
  });
});
