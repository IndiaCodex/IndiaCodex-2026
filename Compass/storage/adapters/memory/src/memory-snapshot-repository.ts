/**
 * The simplest implementation of SnapshotRepositoryPort that satisfies the
 * port — nothing persists beyond process memory (ADR 0008). This is the
 * right default for local development, tests, and any use where snapshot
 * history doesn't need to survive a restart; a durable adapter (e.g.
 * @compass/storage-sqlite) is a drop-in replacement behind the same port
 * when it's actually needed.
 */
import { compareTimestamps } from '@compass/domain';
import type { Snapshot, SnapshotId } from '@compass/domain';
import type { SnapshotFilter, SnapshotRepositoryPort, SnapshotSummary } from '@compass/storage-sdk';

export class MemorySnapshotRepository implements SnapshotRepositoryPort {
  private readonly snapshotsById = new Map<SnapshotId, Snapshot>();

  public save(snapshot: Snapshot): Promise<void> {
    this.snapshotsById.set(snapshot.id, snapshot);
    return Promise.resolve();
  }

  public getLatest(): Promise<Snapshot | null> {
    let latest: Snapshot | null = null;
    for (const snapshot of this.snapshotsById.values()) {
      if (!latest || compareTimestamps(snapshot.createdAt, latest.createdAt) > 0) {
        latest = snapshot;
      }
    }
    return Promise.resolve(latest);
  }

  public getById(id: SnapshotId): Promise<Snapshot | null> {
    return Promise.resolve(this.snapshotsById.get(id) ?? null);
  }

  public list(filter?: SnapshotFilter): Promise<readonly SnapshotSummary[]> {
    const summaries: SnapshotSummary[] = [];
    for (const snapshot of this.snapshotsById.values()) {
      if (filter?.before && compareTimestamps(snapshot.createdAt, filter.before) >= 0) continue;
      if (filter?.after && compareTimestamps(snapshot.createdAt, filter.after) <= 0) continue;
      summaries.push({ id: snapshot.id, createdAt: snapshot.createdAt });
    }
    return Promise.resolve(summaries);
  }

  /** Clears everything. Intended for tests; a real workflow has no reason to call this. */
  public clear(): void {
    this.snapshotsById.clear();
  }
}
