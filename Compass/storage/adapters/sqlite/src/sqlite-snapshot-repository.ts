/**
 * A durable SnapshotRepositoryPort backed by SQLite (ADR 0010). Each
 * Snapshot is stored as a single JSON blob keyed by id — deliberately not
 * a normalized relational schema mirroring the whole domain model, which
 * would be substantially more machinery than v1 needs and would have to
 * be migrated every time the domain model grows a field (ADR 0008).
 * Filtering and "latest" resolution happen in application code using the
 * same `compareTimestamps` semantics as every other adapter, rather than
 * relying on SQL string ordering matching ISO-8601 chronological order.
 */
import Database from 'better-sqlite3';
import { compareTimestamps, toSnapshotId, toTimestamp } from '@compass/domain';
import type { Snapshot, SnapshotId } from '@compass/domain';
import type { SnapshotFilter, SnapshotRepositoryPort, SnapshotSummary } from '@compass/storage-sdk';
import type { Database as DatabaseHandle } from 'better-sqlite3';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    data TEXT NOT NULL
  );
`;

interface SnapshotRow {
  readonly id: string;
  readonly created_at: string;
  readonly data: string;
}

interface SummaryRow {
  readonly id: string;
  readonly created_at: string;
}

export class SqliteSnapshotRepository implements SnapshotRepositoryPort {
  private readonly db: DatabaseHandle;

  /** @param filename A file path, or ":memory:" for an ephemeral, in-process database (the default — useful for tests). */
  public constructor(filename = ':memory:') {
    this.db = new Database(filename);
    this.db.exec(SCHEMA);
  }

  public save(snapshot: Snapshot): Promise<void> {
    this.db
      .prepare(
        'INSERT INTO snapshots (id, created_at, data) VALUES (@id, @createdAt, @data) ' +
          'ON CONFLICT(id) DO UPDATE SET created_at = excluded.created_at, data = excluded.data',
      )
      .run({ id: snapshot.id, createdAt: snapshot.createdAt, data: JSON.stringify(snapshot) });
    return Promise.resolve();
  }

  public getLatest(): Promise<Snapshot | null> {
    const rows = this.db.prepare('SELECT id, created_at, data FROM snapshots').all() as SnapshotRow[];
    let latest: Snapshot | null = null;
    for (const row of rows) {
      const snapshot = JSON.parse(row.data) as Snapshot;
      if (!latest || compareTimestamps(snapshot.createdAt, latest.createdAt) > 0) {
        latest = snapshot;
      }
    }
    return Promise.resolve(latest);
  }

  public getById(id: SnapshotId): Promise<Snapshot | null> {
    const row = this.db.prepare('SELECT data FROM snapshots WHERE id = ?').get(id) as { data: string } | undefined;
    return Promise.resolve(row ? (JSON.parse(row.data) as Snapshot) : null);
  }

  public list(filter?: SnapshotFilter): Promise<readonly SnapshotSummary[]> {
    const rows = this.db.prepare('SELECT id, created_at FROM snapshots').all() as SummaryRow[];
    const summaries = rows
      .map((row) => ({ id: toSnapshotId(row.id), createdAt: toTimestamp(row.created_at) }))
      .filter((summary) => !filter?.before || compareTimestamps(summary.createdAt, filter.before) < 0)
      .filter((summary) => !filter?.after || compareTimestamps(summary.createdAt, filter.after) > 0);
    return Promise.resolve(summaries);
  }

  /** Releases the underlying file handle / in-memory database. Call once the repository is no longer needed. */
  public close(): void {
    this.db.close();
  }
}
