# 0007. The Knowledge Graph Is a Sequence of Immutable Snapshots, Not a Single Mutable State

## Status

Accepted

## Context

Several questions Compass exists to answer are inherently historical rather than about current state: *which release introduced this incompatibility* has no answer if the system only ever exposes "what's true right now." A single, continuously mutated graph — updated in place as new ingestion runs complete — cannot answer that question, because the state that would answer it has already been overwritten by the time anyone asks.

There's also a trust dimension: a consumer acting on a compatibility answer benefits from knowing exactly what data that answer was computed against, and being able to get the same answer again later by asking against the same point in time — a form of the same reproducibility guarantee that governs rule evaluation itself (see [ADR 0002](0002-deterministic-rule-based-compatibility-engine.md)).

## Decision

Each completed ingestion and evaluation run produces a new, immutable **Snapshot** of the Knowledge Graph. Releases, once ingested into a snapshot, are never mutated — corrections are recorded as new Evidence going forward, not rewrites of history. Every query can be scoped to the latest snapshot or to a specific historical one, through the same mechanism (see [knowledge-graph.md](../architecture/knowledge-graph.md#versioned-snapshots)).

## Alternatives Considered

**A single mutable current-state graph**, updated in place, with historical questions answered by a separate audit log if needed. Rejected because it splits the system's source of truth into two different mechanisms with two different query shapes — the graph for "what's true now," a log for "what was true before" — when a sequence of immutable snapshots answers both with one mechanism and one query pattern.

**Snapshotting only on a fixed schedule** (e.g., nightly) regardless of whether ingestion produced new data, to reduce snapshot volume. Rejected in favor of snapshotting on every completed ingestion run: snapshot volume is a storage-adapter concern the [storage port](../architecture/knowledge-graph.md#storage-abstraction) can manage (e.g., retention policy), and coupling "when a new snapshot exists" to "when new data actually arrived" keeps the historical record precise rather than approximated to a schedule.

## Consequences

Historical queries — which release introduced an incompatibility, what the ecosystem looked like before a given upgrade — are answerable directly, without a separate subsystem. Every `Compatibility Relationship`, `Risk`, and `Recommendation` records which snapshot produced it, which is what lets [ADR 0006](0006-evidence-mandatory-fail-closed.md)'s traceability guarantee extend through time, not just through a single evaluation. The cost is storage growth over time, which is an explicit input to the [storage adapter](0008-simplest-storage-adapter-first.md) decision below, not a reason to weaken this guarantee.
