# Clean Architecture (Ports &amp; Adapters)

The dependency direction the codebase actually enforces: `apps/* →
packages/adapters/* & packages/application → packages/domain`.
`packages/domain` depends on nothing else in this repository — verified by
grepping the package for `@sentinel/*` imports and finding none outside doc
comments.

```mermaid
flowchart TD
    subgraph Apps["apps/ — composition roots"]
        Server["apps/server<br/>Fastify HTTP API"]
        WebApp["apps/web<br/>React console"]
    end

    subgraph Application["packages/application — use cases"]
        UC1["CaptureEventUseCase"]
        UC2["GenerateExplainabilityReportUseCase"]
        UC3["GenerateExecutionAuditExportUseCase"]
    end

    subgraph Domain["packages/domain — zero dependencies"]
        Ports["Ports<br/>StoragePort · ExecutionJournalPort<br/>MasumiAdapterPort · ExportPort"]
        Core["Entities &amp; domain services<br/>hash chain · verifyArtifact · replayArtifact"]
        Ports --- Core
    end

    subgraph Adapters["packages/adapters/* &amp; packages/execution-journal"]
        SQLite["storage-sqlite"]
        Memory["storage-memory"]
        MasumiAdapter["masumi<br/>(MockMasumiAdapter)"]
        ExportJSON["export-json"]
        Journal["execution-journal<br/>SentinelExecutionJournal"]
    end

    Server --> UC1 & UC2 & UC3
    WebApp -->|"HTTP only — never imports<br/>domain runtime code"| Server
    UC1 & UC2 & UC3 --> Ports
    Journal --> Ports
    SQLite -. implements .-> Ports
    Memory -. implements .-> Ports
    MasumiAdapter -. implements .-> Ports
    ExportJSON -. implements .-> Ports
    Server --> SQLite
    Server --> MasumiAdapter
    Server --> ExportJSON
    Server --> Journal

    style Domain fill:#11151d,stroke:#3ecf8e,color:#e9ecf3
    style Application fill:#171c26,stroke:#4a90f0,color:#e9ecf3
    style Adapters fill:#171c26,stroke:#f0b944,color:#e9ecf3
```

**Reading it:** dependencies only ever point inward and down. Domain defines
ports as interfaces and never imports a concrete adapter; adapters implement
those interfaces and are swapped in only at the composition root
(`apps/server/src/composition.ts`). Swapping SQLite for PostgreSQL, or the
mock Masumi adapter for a real client, means writing a new adapter package —
it never touches `packages/domain` or `packages/application`.

Source of truth: [`docs/architecture.md`](../architecture.md) §1–§4.
