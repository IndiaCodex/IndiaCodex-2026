# Replay Flow

Replay never re-invokes a live LLM, tool, external API, or Masumi service —
it reconstructs an execution purely from what was already captured, after
independently re-verifying that record twice: once at the Journal level,
once at the Artifact level.

```mermaid
sequenceDiagram
    participant Caller as Caller (route / seed script)
    participant Journal as SentinelExecutionJournal
    participant Storage as StoragePort
    participant Domain as verifyJournalChain / verifyArtifact / replayArtifact

    Caller->>Journal: replay(executionId)
    Journal->>Storage: getArtifact(executionId)
    alt artifact already sealed
        Storage-->>Journal: ExecutionArtifact
    else not yet sealed
        Journal->>Storage: getJournalEntries(executionId)
        Storage-->>Journal: JournalEntry[]
        Journal->>Domain: verifyJournalChain(entries)
        Domain-->>Journal: intact? (hash chain recomputed)
        Journal->>Domain: sealJournal(entries, identity, provenance)
        Domain-->>Journal: ExecutionArtifact
        Journal->>Storage: saveArtifact(artifact)
    end
    Journal->>Domain: replayArtifact(artifact)
    Domain->>Domain: verifyArtifact(artifact) — six independent checks
    alt verification fails
        Domain-->>Journal: throw ReplayIntegrityError(report)
    else verification passes
        Domain-->>Journal: ReplaySession { fidelity: "identical", replayedTimeline, ... }
    end
    Journal-->>Caller: ReplaySession
```

**Reading it:** two layers of integrity checking gate every replay — journal
integrity first (has the live, append-only store been altered since
write time), then artifact integrity second (does the sealed, portable
artifact still hash-verify on its own). `fidelity` is `"identical"`
whenever verification passes, because Sentinel reconstructs from its own
recorded Events rather than re-executing independent agent code — there is
nothing external for the reconstruction to diverge from. Replay is
idempotent: re-sealing an already-sealed execution returns the existing
artifact rather than minting a new one.

Source of truth: [`packages/execution-journal/src/execution-journal.ts`](../../packages/execution-journal/src/execution-journal.ts),
[`packages/domain/src/replay/replay-artifact.ts`](../../packages/domain/src/replay/replay-artifact.ts).
