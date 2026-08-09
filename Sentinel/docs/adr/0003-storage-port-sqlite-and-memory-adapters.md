# ADR-0003: StoragePort with Interchangeable SQLite and In-Memory Adapters

## Status

Accepted. Implemented.

## Context

Sentinel needs to persist Executions, Journal entries, and Execution
Artifacts, with two real deployment shapes: local development / CI /
demo (zero-ops, no external process) and eventual production (concurrent
writers, larger datasets). Neither should be assumed by domain or
application code.

## Decision

All persistence goes through one `StoragePort` interface, owned by
`@sentinel/domain`. Two adapters implement it:

- `@sentinel/storage-sqlite` (default) — better-sqlite3. No SQL leaks
  outside this package; the `journal_entries` table is insert-only by
  construction (no `UPDATE`/`DELETE` statement exists in the adapter at
  all, not just by convention).
- `@sentinel/storage-memory` — in-memory `Map`-based, used for fast unit
  tests and as an ephemeral runtime option (`SENTINEL_STORAGE_DRIVER=memory`).

Both are validated by **one shared contract test suite**
(`runStoragePortContractTests`, exported from
`@sentinel/storage-memory/contract`), run unmodified against both
adapters — the mechanism that makes "interchangeable" a proven property,
not an assumption. A future PostgreSQL adapter reuses the same suite.

## Alternatives considered

- **PostgreSQL only.** Rejected: forces an external database dependency
  onto local dev, CI, and the single-command demo.
- **SQLite only, indefinitely.** Rejected: doesn't scale to concurrent
  writers if this goes past a demo.

## Consequences

- No migration framework — `CREATE TABLE IF NOT EXISTS` only, acceptable
  for one schema version (tracked in `roadmap.md`).
- No concurrency control on `ExecutionJournalPort.append` — a genuine
  race between two concurrent appends for the same execution isn't
  locked. Fine for the single-threaded demo; a real gap before
  concurrent production use (tracked in `roadmap.md`).
