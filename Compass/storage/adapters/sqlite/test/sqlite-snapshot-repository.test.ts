import { existsSync, unlinkSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { createEmptySnapshot, toSnapshotId, toTimestamp } from '@compass/domain';
import { checkSnapshotRepositoryConformance } from '@compass/storage-sdk';
import { SqliteSnapshotRepository } from '../src/index.js';

const openRepositories: SqliteSnapshotRepository[] = [];

function openRepository(filename?: string): SqliteSnapshotRepository {
  const repo = new SqliteSnapshotRepository(filename);
  openRepositories.push(repo);
  return repo;
}

afterEach(() => {
  while (openRepositories.length > 0) {
    openRepositories.pop()?.close();
  }
});

describe('SqliteSnapshotRepository', () => {
  it('passes the shared SnapshotRepositoryPort conformance suite, against an in-memory database', async () => {
    const violations = await checkSnapshotRepositoryConformance(openRepository());
    expect(violations).toEqual([]);
  });

  it('defaults to an in-memory database when no filename is given', async () => {
    const repo = openRepository();
    expect(await repo.getLatest()).toBeNull();
  });

  it('starts empty', async () => {
    const repo = openRepository();
    expect(await repo.getLatest()).toBeNull();
    expect(await repo.list()).toEqual([]);
    expect(await repo.getById(toSnapshotId('missing'))).toBeNull();
  });

  it('round-trips a full snapshot through JSON serialization without loss', async () => {
    const repo = openRepository();
    const snapshot = {
      ...createEmptySnapshot(toSnapshotId('snap-1'), toTimestamp('2026-01-01T00:00:00.000Z')),
      components: [
        { id: 'component-1' as never, name: 'sdk-a', type: 'sdk' as const, repositoryId: 'repo-1' as never },
      ],
    };
    await repo.save(snapshot);
    const retrieved = await repo.getById(snapshot.id);
    expect(retrieved).toEqual(snapshot);
  });

  it('save() upserts — saving the same id twice overwrites rather than duplicating', async () => {
    const repo = openRepository();
    const snapshot = createEmptySnapshot(toSnapshotId('snap-1'), toTimestamp('2026-01-01T00:00:00.000Z'));
    const updated = { ...snapshot, createdAt: toTimestamp('2026-02-01T00:00:00.000Z') };

    await repo.save(snapshot);
    await repo.save(updated);

    expect(await repo.list()).toHaveLength(1);
    expect((await repo.getById(snapshot.id))?.createdAt).toBe(updated.createdAt);
  });

  it('persists data on disk across separate repository instances pointed at the same file', async () => {
    const path = `/tmp/compass-sqlite-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`;
    try {
      const writer = new SqliteSnapshotRepository(path);
      const snapshot = createEmptySnapshot(toSnapshotId('snap-1'), toTimestamp('2026-01-01T00:00:00.000Z'));
      await writer.save(snapshot);
      writer.close();

      const reader = openRepository(path);
      const retrieved = await reader.getById(snapshot.id);
      expect(retrieved?.id).toBe(snapshot.id);
    } finally {
      if (existsSync(path)) unlinkSync(path);
    }
  });
});
