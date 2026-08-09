import type { Snapshot, SnapshotId, Timestamp } from '@compass/domain';

export interface SnapshotSummary {
  readonly id: SnapshotId;
  readonly createdAt: Timestamp;
}

export interface SnapshotFilter {
  readonly before?: Timestamp;
  readonly after?: Timestamp;
}

/**
 * The storage port every use case depends on to persist and retrieve
 * Knowledge Graph snapshots (docs/architecture/knowledge-graph.md#storage-abstraction).
 * `core/application` knows only this interface — never a concrete adapter.
 */
export interface SnapshotRepositoryPort {
  save(snapshot: Snapshot): Promise<void>;
  getLatest(): Promise<Snapshot | null>;
  getById(id: SnapshotId): Promise<Snapshot | null>;
  list(filter?: SnapshotFilter): Promise<readonly SnapshotSummary[]>;
}
