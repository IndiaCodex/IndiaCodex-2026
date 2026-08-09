# Data Flow & Sequence Diagrams

These trace the same architecture described in [compatibility-engine.md](compatibility-engine.md), [knowledge-graph.md](knowledge-graph.md), and [interfaces.md](interfaces.md) through time, for the three flows that matter most in practice: getting ecosystem data in, answering a query, and gating a pull request. The shapes below are accurate; the illustrative command name (`compass advise`) and `compass.config` reference predate the shipped `forge-midnight` CLI and its actual flag-based configuration — see [interfaces.md](interfaces.md#cli) for the real command surface.

## Data Flow: Ingestion

How raw ecosystem data becomes a new Knowledge Graph snapshot.

```mermaid
flowchart LR
    subgraph External["External Ecosystem Sources"]
        GH[GitHub]
        REG[Package Registries]
        CI[CI Result Feeds]
    end
    subgraph Plugin["Midnight Plugin"]
        SA[Source Adapter]
        CX[Capability Extractor]
    end
    subgraph Core["Core Domain"]
        NORM[Normalized entities\n+ Evidence]
        RE[Rule Engine]
        SNAP[New Snapshot]
    end
    STORE[(Storage Adapter)]

    GH --> SA
    REG --> SA
    CI --> SA
    SA --> NORM
    SA --> CX
    CX --> NORM
    NORM --> RE
    RE --> SNAP
    SNAP --> STORE
```

Ingestion runs on a schedule and never blocks a query — see [cross-cutting-concerns.md](cross-cutting-concerns.md#performance-assumptions) for why that separation matters for CI latency.

## Data Flow: Query

How a delivery surface answers a question, against the latest completed snapshot.

```mermaid
flowchart LR
    subgraph Delivery["Delivery Surface (CLI / API / Action)"]
        REQ[Request]
    end
    subgraph App["core/application"]
        UC[Use Case:\ne.g. BuildCompatibilityMatrix]
    end
    STORE[(Storage Adapter)]
    subgraph Core["Core Domain"]
        CE[Compatibility Engine]
    end
    RESP[Response]

    REQ --> UC
    UC --> STORE
    STORE --> UC
    UC --> CE
    CE --> UC
    UC --> RESP
```

Queries are read-only against an existing snapshot. They never trigger ingestion — a slow external source cannot make a query slow.

## Sequence: CI Compatibility Check on a Pull Request

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant Action as GitHub Action
    participant App as core/application
    participant Engine as Compatibility Engine
    participant Store as Storage Adapter

    Dev->>GH: Open pull request (changes a dependency)
    GH->>Action: Trigger workflow
    Action->>Action: Read compass.config from repo
    Action->>App: EvaluateChangeCompatibility(declared stack)
    App->>Store: getSnapshot("latest")
    Store-->>App: Snapshot
    App->>Engine: Evaluate affected Compatibility Relationships
    Engine-->>App: Relationships (status + Evidence + Rules)
    App-->>Action: Result (pass | fail | unverified, with reasons)
    Action->>GH: Post check run (status + explanation)
    GH-->>Dev: Check result visible on PR
```

The Action never re-ingests the ecosystem inline — it evaluates the PR's declared stack against the most recent completed snapshot, which is what keeps this fast enough to gate a merge (see [interfaces.md](interfaces.md#github-action)).

## Sequence: CLI Upgrade Advisor Query

```mermaid
sequenceDiagram
    participant User as Developer
    participant CLI as CLI
    participant App as core/application
    participant Engine as Compatibility Engine
    participant Store as Storage Adapter

    User->>CLI: compass advise --component sdk --to 2.0
    CLI->>App: EvaluateUpgrade(component, currentStack, target)
    App->>Store: getSnapshot("latest")
    Store-->>App: Snapshot
    App->>Engine: Evaluate target against dependent stack
    Engine-->>App: Compatibility Relationships + any Breaking Changes
    App-->>CLI: Recommendation (Upgrade | Avoid | Hold | InvestigateFurther) + rationale
    CLI-->>User: Human-readable (or --format json) output
```

## Sequence: Scheduled Ingestion Run

```mermaid
sequenceDiagram
    participant Sched as Scheduler
    participant Orch as Ingestion Orchestrator
    participant Plugin as Midnight Plugin
    participant Core as Core Domain
    participant Store as Storage Adapter

    Sched->>Orch: Trigger ingestion run
    Orch->>Plugin: Source Adapter: discover releases
    Plugin-->>Orch: Raw ecosystem data
    Orch->>Plugin: Capability Extractor: parse manifests
    Plugin-->>Orch: Capabilities, Constraints
    Orch->>Core: Normalize into Components/Releases/Artifacts + Evidence
    Core->>Core: Rule Engine evaluates applicable rules
    Core->>Core: Compatibility Engine aggregates relationships
    Core->>Store: saveSnapshot(new snapshot)
    Store-->>Orch: Snapshot persisted
```

A failure at any plugin step is isolated to the data that plugin was responsible for — see [cross-cutting-concerns.md](cross-cutting-concerns.md#error-handling-strategy) for how partial ingestion failure is handled without discarding an otherwise-good snapshot.
