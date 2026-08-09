/**
 * Schema for the SQLite `StoragePort` adapter. Intentionally minimal —
 * one table per StoragePort concern, JSON columns for the parts of the
 * domain shape that don't need to be queried directly. No migration
 * framework yet (tracked as deferred tech debt); `CREATE TABLE IF NOT
 * EXISTS` is sufficient for a single-schema-version MVP.
 *
 * `journal_entries` is insert-only by construction: no code path in
 * this package issues `UPDATE` or `DELETE` against it, which is what
 * makes the Journal actually append-only at the storage layer, not just
 * by convention (Step 3.2 requirement).
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS executions (
  execution_id   TEXT PRIMARY KEY,
  workflow_id    TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  trace_id       TEXT NOT NULL,
  status         TEXT NOT NULL,
  started_at     TEXT NOT NULL,
  ended_at       TEXT NULL,
  timeline_json  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_correlation_id ON executions(correlation_id);
CREATE INDEX IF NOT EXISTS idx_executions_trace_id ON executions(trace_id);

CREATE TABLE IF NOT EXISTS journal_entries (
  entry_id            TEXT PRIMARY KEY,
  execution_id        TEXT NOT NULL,
  sequence            INTEGER NOT NULL,
  event_json          TEXT NOT NULL,
  snapshot_json       TEXT NULL,
  previous_entry_hash TEXT NULL,
  entry_hash          TEXT NOT NULL,
  UNIQUE (execution_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_execution_id ON journal_entries(execution_id);

CREATE TABLE IF NOT EXISTS execution_artifacts (
  artifact_id   TEXT PRIMARY KEY,
  execution_id  TEXT NOT NULL UNIQUE,
  root_hash     TEXT NOT NULL,
  artifact_json TEXT NOT NULL
);
`;
