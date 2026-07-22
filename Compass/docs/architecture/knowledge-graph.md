# Knowledge Graph & Storage Abstraction

## The Graph Is Logical, Not a Technology Choice

"Knowledge Graph" here names a shape the domain model already implies, not a mandate to adopt graph-database technology. Whether the eventual storage adapter is a graph database, a set of relational tables, or content-addressed files is exactly the kind of decision the storage port ([below](#storage-abstraction)) exists to defer. What's fixed is the logical structure everything else in this architecture — the [Compatibility Engine](compatibility-engine.md), the [API](api-contracts.md), every [interface](interfaces.md) — reads and writes against.

## Logical Structure

**Nodes:** `Component`, `Release`, `Artifact`.

**Edges:**

- `DependsOn` (Release → Release) — carries the `Constraint` that was declared, and the `Dependency` metadata (kind: required/optional/peer/dev)
- `TargetsRuntime` (Release → Release, where the target is a `Runtime`-typed Component's release) — a release declaring which runtime version it was built for or tested against
- `Produces` (Release → Artifact)
- `CompatibleWith` / `IncompatibleWith` / `UnverifiedAgainst` (Release → Release) — the `Compatibility Relationship` produced by the [Compatibility Engine](compatibility-engine.md), carrying its `Compatibility Rule` and `Evidence` references
- `Supersedes` (Release → Release, within the same Component) — the predecessor relationship a `Breaking Change` is always evaluated across

Every query described in [use-cases.md](../use-cases.md) — the matrix, the advisor, breaking-change detection, risk — is a traversal or a filtered view over this graph, not a separate index or computation with its own logic.

## Versioned Snapshots

The graph is not one continuously mutating structure. Each completed ingestion run produces a new, immutable **Snapshot** — a complete, self-consistent state of the graph at that point in time. This is not an optimization; it's required by questions the [problem statement](../problem-statement.md) and [use-cases.md](../use-cases.md) both depend on being answerable, like *which release introduced this incompatibility* — a question with no answer if only "current" state exists.

Consequences of this that show up elsewhere in the architecture:

- Every `Compatibility Relationship`, `Risk`, and `Recommendation` records which snapshot produced it.
- A query can be scoped to "current" (the latest snapshot) or to a specific historical snapshot — the same query mechanism serves both.
- Releases, once ingested into a snapshot, are immutable (see [domain-model.md](domain-model.md#invariants)); a correction is new Evidence recorded going forward, not a rewrite of a past snapshot.
- CI checks (see [interfaces.md](interfaces.md#github-action)) read against the latest completed snapshot — they never trigger ingestion inline, which is what keeps their latency independent of ingestion cost (see [cross-cutting-concerns.md](cross-cutting-concerns.md#performance-assumptions)).

## Storage Abstraction

`core/application` depends on a `SnapshotRepository` port, not a database. Its shape, conceptually:

- `saveSnapshot(snapshot)` — persist a newly completed ingestion/evaluation run
- `getSnapshot(id | "latest")` — retrieve a specific or the most recent snapshot
- `listSnapshots(filter)` — for historical queries across a range
- `appendEvidence(evidence, snapshotId)` — record new Evidence against a snapshot in progress

`core/application` and the [Compatibility Engine](compatibility-engine.md) know only this interface. They cannot tell whether the concrete adapter behind it is a single JSON file or a distributed database, and they must never be written in a way that would let them tell.

### The First Adapter Should Be the Simplest Thing That Works

Compass's own v1 performance assumptions ([cross-cutting-concerns.md](cross-cutting-concerns.md#performance-assumptions)) — tens of components, hundreds of releases each — describe a graph that fits comfortably in memory and on local disk. Building a distributed, horizontally-scaled storage layer for that scale, before real usage has demonstrated it's needed, is exactly the kind of complexity this architecture is designed to resist. The first concrete `SnapshotRepository` adapter should be the simplest implementation that satisfies the port — see [ADR 0008](../adr/0008-simplest-storage-adapter-first.md) for the reasoning and the explicit trigger conditions for revisiting it.

Because the port is the only thing `core/application` depends on, replacing that first adapter later — with a hosted database once the [Dashboard](interfaces.md#dashboard) or multi-tenant enterprise use needs it (see [roadmap.md](../roadmap.md), [business-case.md](../business-case.md)) — is a new module under `storage/adapters/`, not a change to the Core Domain. This is the direct payoff of treating storage as a port from day one rather than deferring the abstraction until the simple version starts to hurt.
