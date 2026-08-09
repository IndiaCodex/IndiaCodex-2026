# Architecture Decision Records

An ADR captures a significant, hard-to-reverse decision: the context
that forced it, the decision itself, alternatives considered, and the
consequences accepted as a result. ADRs are not edited after acceptance
— a changed decision gets a new ADR that supersedes the old one, so the
history of _why_ stays intact.

| ADR                                                         | Title                                                                            | Status   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| [0001](0001-deterministic-replay-via-captured-snapshots.md) | Deterministic Replay via Captured Snapshots                                      | Accepted |
| [0002](0002-dual-mode-explainability.md)                    | Dual-Mode Explainability — Engineering Mode Implemented, Assistant Mode Deferred | Accepted |
| [0003](0003-storage-port-sqlite-and-memory-adapters.md)     | StoragePort with Interchangeable SQLite and In-Memory Adapters                   | Accepted |
| [0004](0004-execution-artifact-and-audit-export.md)         | Execution Artifact as a Portable Record, Extended to the Full Audit Export       | Accepted |
| [0005](0005-identity-and-correlation-model.md)              | Four-Field Identity and Correlation Model                                        | Accepted |
| [0006](0006-execution-journal-naming.md)                    | "Execution Journal," Not "Replay Engine"                                         | Accepted |
| [0007](0007-two-phase-tool-and-payment-events.md)           | Two-Phase Tool and Payment Events                                                | Accepted |
| [0008](0008-client-side-search-and-filtering.md)            | Client-Side Search/Filter/Sort Over a Fetched Page                               | Accepted |
| [0009](0009-live-masumi-enrichment-at-capture.md)           | Live Masumi Enrichment at Capture Time                                           | Accepted |

See [`../architecture.md`](../architecture.md) for the system as built
and [`../roadmap.md`](../roadmap.md) for what each ADR's "Consequences"
section defers to later.
