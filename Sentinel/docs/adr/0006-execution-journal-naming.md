# ADR-0006: "Execution Journal," Not "Replay Engine"

## Status

Accepted. Implemented.

## Context

The subsystem responsible for recording and replaying an Execution was
initially going to be named "Replay Engine." That name foregrounds a
single, less-frequent, read-only operation (replay) and evokes a
debugger. The same subsystem is also responsible for the write path that
happens on _every_ Execution, _every_ time: durably recording the
ordered, hash-chained sequence of Events and Snapshots as they occur.
Replay is downstream of that record — you can only deterministically
replay what was completely recorded first.

## Decision

The package is `@sentinel/execution-journal`; the class is
`SentinelExecutionJournal`; the port is `ExecutionJournalPort`. The name
is deliberately chosen after the write-ahead-log / journaling-filesystem
pattern: an append-only record written as things happen, with recovery
(here, replay) defined as _replaying the journal_. `SentinelExecutionJournal.replay()`
literally is `seal()` (write-path integrity check) followed by
`replayArtifact()` (read-path reconstruction) — the name matches what
the code does.

## Consequences

- `sentinel replay <id>` as a CLI verb (not yet built) would still read
  naturally — the rename affects the subsystem's name, not the
  user-facing verb for the operation it performs.
- Anyone extending this subsystem should keep both halves (record +
  replay) in the same package rather than splitting them — the name is
  a statement that they're one responsibility, not two.
