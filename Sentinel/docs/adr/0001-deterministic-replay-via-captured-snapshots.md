# ADR-0001: Deterministic Replay via Captured Snapshots

## Status

Accepted. Implemented.

## Context

Agent executions involve genuinely nondeterministic operations: LLM
completions, tool calls, external API responses. If "replay" means
"run the agent again," that's a new, independent execution — not a
reproduction of the original. That would make failure analysis
unreliable, comparison meaningless, and audit unverifiable.

## Decision

Every nondeterministic operation is captured at execution time as a
`Snapshot` — the exact request and response. Replay never re-invokes a
live LLM, tool, external API, or Masumi service; it feeds the captured
`Snapshot.response` back instead. Enforced structurally, not by
convention: `appendJournalEntry` (`packages/domain/src/journal/`)
rejects an Event that's missing a required Snapshot, and rejects one
that carries a Snapshot it shouldn't (`requiresSnapshot` — Decision and
"completed"-phase Tool/Payment events always need one; "invoked"/
"requested"-phase and Lifecycle events never do).

`replayArtifact` (`packages/domain/src/replay/`) reconstructs a
Timeline purely from an artifact's own `timeline` + `snapshots` — no
StoragePort, no I/O of any kind.

## Consequences

- Snapshot storage cost scales with LLM/tool payload size — full
  request/response bodies are retained per Execution.
- Sensitive data in captured payloads has no redaction pass yet (see
  `roadmap.md`).
- `ReplaySession.fidelity` is `"identical"` whenever verification
  passes: there is no independent execution to diverge from, since
  Sentinel reconstructs from its own recorded Events rather than
  re-running instrumented agent code. `"diverged"` is reserved for a
  future replay mode that does the latter.
