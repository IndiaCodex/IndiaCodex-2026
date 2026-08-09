# Diagrams

Every diagram here is generated from the actual code and package manifests,
not drawn from an idealized version of the architecture — each file names
its own source of truth at the bottom. All render natively as Mermaid on
GitHub.

| Diagram                                                 | What it shows                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| [System Architecture](system-architecture.md)           | Where Sentinel sits relative to an agent runtime and Masumi                 |
| [Clean Architecture](clean-architecture.md)             | The enforced ports-and-adapters dependency direction                        |
| [Execution Flow](execution-flow.md)                     | What happens between a `POST /events` call and a hash-chained Journal entry |
| [Replay Flow](replay-flow.md)                           | Seal → journal integrity check → artifact integrity check → reconstruction  |
| [Verification Flow](verification-flow.md)               | The six independent checks inside `verifyArtifact`                          |
| [Masumi Integration](masumi-integration.md)             | The live `MasumiAdapterPort.enrichPayment()` call during capture            |
| [Package Dependency Graph](package-dependency-graph.md) | The real `dependencies` edges across every workspace package                |

See [`docs/architecture.md`](../architecture.md) for the prose version of
the same system and [`docs/adr/`](../adr/) for the reasoning behind each
decision these diagrams depict.
