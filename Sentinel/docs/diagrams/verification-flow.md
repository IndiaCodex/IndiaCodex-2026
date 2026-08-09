# Verification Flow

`verifyArtifact` recomputes six independent checks from an
`ExecutionArtifact`'s own `timeline` and `snapshots` — no database, no
`StoragePort`, no access to the live Journal. This is what makes an exported
audit bundle sufficient on its own: anyone with the file can run the same
checks Sentinel ran.

```mermaid
flowchart TD
    A["ExecutionArtifact<br/>(timeline + snapshots + rootHash)"] --> B{"schemaVersionSupported"}
    A --> C{"eventOrdering<br/>sequence[i] === i for every event"}
    A --> D{"identityConsistency<br/>every event/snapshot belongs<br/>to this executionId"}
    A --> E{"snapshotConsistency<br/>Snapshot present iff required<br/>(ADR-0001 invariant)"}
    A --> F["recomputeHashChain(timeline, snapshots)"]
    F --> G{"hashChain<br/>recomputation succeeds"}
    F --> H{"rootHash<br/>recomputed root === artifact.rootHash"}

    B & C & D & E & G & H --> I{"valid = every check passes"}
    I -->|"yes"| J["VerificationReport<br/>valid: true, issues: []"]
    I -->|"no"| K["VerificationReport<br/>valid: false, issues: [...]"]

    style J fill:#11151d,stroke:#3ecf8e,color:#e9ecf3
    style K fill:#11151d,stroke:#f0596b,color:#e9ecf3
```

**Reading it:** `rootHash` is the check that actually detects tampering —
SHA-256's avalanche property means any altered event or snapshot anywhere in
the timeline changes the final root. The other five checks catch structural
corruption (wrong schema version, out-of-order events, cross-execution
contamination, a missing or misplaced Snapshot) that a hash mismatch alone
wouldn't explain to a human reading the report. `replayArtifact` refuses to
proceed at all when `valid` is `false` — verification always gates replay,
never the other way around.

Source of truth: [`packages/domain/src/artifact/verify-artifact.ts`](../../packages/domain/src/artifact/verify-artifact.ts).
