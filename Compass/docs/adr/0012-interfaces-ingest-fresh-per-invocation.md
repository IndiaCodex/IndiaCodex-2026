# 0012. Interfaces Ingest a Fresh Snapshot Per Invocation, Until a Persistent Snapshot Service Exists

## Status

Accepted, with a known consequence recorded below rather than deferred silently.

## Context

[interfaces.md](../architecture/interfaces.md) and the [performance assumptions](../architecture/cross-cutting-concerns.md#performance-assumptions) specified in Step 2 describe a GitHub Action that "never triggers ingestion inline" and "only ever queries an existing snapshot," on the assumption that a scheduled, always-on ingestion process keeps a shared Knowledge Graph snapshot fresh, and every interface queries it.

Building the actual product surface in Step 3.3 revealed that assumption depends on infrastructure this repository doesn't have yet: a persistent, periodically-refreshed snapshot store that outlives a single CLI invocation or Action run. No such service exists — `interfaces/cli` and `interfaces/github-action` each own their own composition root (by design, per this same document), and each defaults to an ephemeral in-memory `SnapshotRepositoryPort`. Without a shared, already-fresh snapshot to query, the only way for either interface to answer a real question is to ingest one itself, on the spot.

## Decision

Both `forge-midnight`'s commands and the GitHub Action call `IngestSnapshotUseCase` directly, synchronously, once per invocation, against the real `MidnightSourceAdapter`. The CLI additionally accepts `--db <path>` (a SQLite file) so a maintainer who wants snapshot *history* — the cross-snapshot Breaking Change Analyzer needs at least two — can persist and reuse it across runs, but even that mode still ingests fresh at `analyze` time; nothing here schedules ingestion independently of an invocation.

## Consequences

This is a real, deliberate simplification, not an oversight, and it has a real cost: every `forge-midnight` command and every Action run makes a full round of live GitHub API calls before it can answer anything, which means Action latency scales with the ecosystem's size and the GitHub API's availability and rate limits, not with query complexity. The documented "low single-digit seconds" CI budget in [cross-cutting-concerns.md](../architecture/cross-cutting-concerns.md#performance-assumptions) does not hold for the Action as shipped — that assumption stays written down as the target, not silently dropped, because it's still the right target once a persistent snapshot service exists.

The fix is exactly what [roadmap.md](../roadmap.md)'s Phase 3/4 already anticipates and this repository has not built: a scheduled ingestion process that owns the canonical, always-fresh snapshot, with the Action changed to query it instead of calling `IngestSnapshotUseCase` itself. That change is additive and contained — `IngestSnapshotUseCase`, every port, and every use case in `core/application` are already exactly what such a service would call; nothing about today's decision requires an architecture change to unwind later, only a new scheduled caller and a shared store behind the existing `SnapshotRepositoryPort`.

## Alternatives Considered

**Block Step 3.3 on building the scheduled ingestion service first.** Rejected: it's real, separate infrastructure (a long-running process, a deployment target, a schedule) that has nothing to do with proving the CLI, Action, and reporting layer are correct and useful today. Building it first would have meant no usable product surface at all for this milestone.

**Have the Action silently claim to query an existing snapshot while actually ingesting one.** Rejected outright — this is the option this ADR exists to rule out. Documentation that doesn't match behavior is worse than an honestly-scoped limitation.
