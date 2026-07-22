# FAQ

## Is Compass an official Midnight project?

No. It's an independent tool built against Midnight's public repositories and their real, publicly available release metadata. Nothing about its architecture requires official status to be useful — the plugin model (see [plugin-architecture.md](architecture/plugin-architecture.md)) is exactly what would let an official maintainer take it over, extend it, or fork its ecosystem coverage without touching the engine underneath.

## Does Compass use AI/ML to determine compatibility?

No, deliberately. Every compatibility verdict comes from either a declarative rule pack or a release's own declared dependency constraint, evaluated deterministically — the same inputs always produce the same output, and every conclusion cites the specific evidence it was derived from. See [ADR 0002](adr/0002-deterministic-rule-based-compatibility-engine.md) and [ADR 0006](adr/0006-evidence-mandatory-fail-closed.md) for why: a compatibility tool that's occasionally wrong in a way nobody can explain is worse than one that says "unverified" when it doesn't know.

## What happens when Compass doesn't have enough information to answer?

It says `unverified` — never `compatible`. Absence of evidence is fail-closed by design (ADR 0006): a component Compass hasn't ingested data for, or a relationship no rule and no declared constraint speaks to, is reported as unknown, not assumed fine. This is the opposite default from most dependency tooling, and it's the one that matters for a tool whose entire value is trustworthiness.

## Why doesn't the GitHub Action just query an existing snapshot instead of re-ingesting every run?

Because that would require a persistent, scheduled ingestion service this repository doesn't have yet — see [ADR 0012](adr/0012-interfaces-ingest-fresh-per-invocation.md) for the full reasoning, the cost this incurs (Action latency scales with live GitHub API calls, not with query complexity), and why closing this gap is additive rather than an architecture change.

## Why is the domain model (`core/domain`) dependency-free, with even semver hand-rolled?

`core/domain` has zero runtime dependencies on purpose (see [repository-structure.md](architecture/repository-structure.md)) — it's the one layer every plugin, storage adapter, and interface ultimately depends on, so a dependency there becomes a dependency everywhere, and its own compatibility becomes exactly the kind of problem Compass exists to catch for everyone else. `core/domain/src/version.ts` implements semantic version parsing and comparison without a library for the same reason.

## Can Compass support ecosystems other than Midnight?

Architecturally, yes — `core/domain` and `core/application` have no Midnight-specific code anywhere; every Midnight-specific fact enters through `plugins/midnight`'s three extension points (source adapter, capability extractor, rule pack). As a product decision, no: Compass is scoped to Midnight, not designed as a generic multi-ecosystem tool, and broadening that scope is explicitly a fork-the-strategy decision, not a roadmap item — see [roadmap.md](roadmap.md#what-is-out-of-scope-full-stop).

## Why SQLite for storage instead of a "real" database?

Because the v1 scale (tens of components, hundreds of releases each) doesn't need one, and choosing the simplest adapter that satisfies `SnapshotRepositoryPort` first keeps the storage layer honest about what it actually needs — see [ADR 0008](adr/0008-simplest-storage-adapter-first.md). A different adapter behind the same port is a contained change, not a redesign, if scale ever demands it.

## How is a GitHub API rate limit handled?

Unauthenticated requests are capped at 60/hour by GitHub; every command and the Action accept a `--token`/`github-token` to raise that limit using a standard personal access token with no special scopes required (Compass only reads public repository and release metadata). The token is used only to construct request headers — see [SECURITY.md](../SECURITY.md).

## Why not use `@actions/core` / `@actions/github` for the GitHub Action?

The Action needs a handful of well-documented REST calls (list/create/update a PR comment) — small enough that a hand-rolled, injectable-`fetch` client (matching `plugins/midnight`'s existing `RestGitHubClient` pattern) keeps the same "no framework coupling, no hidden dependency surface" discipline the rest of the codebase holds to, rather than pulling in a toolkit for what amounts to three HTTP calls.

## Is this production-ready?

The engine, plugin, and product surface are implemented, tested (400+ tests, ~95% line coverage), and running against real data. What isn't done yet: packaging the Action for external consumption by tag (bundling, e.g. via `@vercel/ncc`), and the scheduled ingestion service ADR 0012 describes. Both are additive, not architectural, gaps — see [roadmap.md](roadmap.md) for the honest current status.
