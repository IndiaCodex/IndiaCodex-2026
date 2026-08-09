# Interfaces: CLI, GitHub Action, Dashboard

## Shared Discipline

Every interface in `interfaces/` is a driving adapter in the Clean Architecture sense ([repository-structure.md](repository-structure.md)): it translates its surface's native input into a call against a `core/application` use case, and translates the result back. None of them contain compatibility logic. If a bug means two interfaces disagree about whether something is compatible, the bug is in `core/application` or below — never in an interface, because an interface has nowhere to keep logic that could disagree.

Each owns exactly one composition root: the place where "which plugin, which storage adapter" gets decided concretely (see [repository-structure.md](repository-structure.md#dependency-rules)).

## CLI

The baseline interface, shipped as `forge-midnight` (`interfaces/cli`). Commands map close to one-to-one onto `core/application` use cases:

- `forge-midnight analyze` — ingest a fresh snapshot and summarize what Compass found (components, releases, relationships, risk)
- `forge-midnight matrix [--format markdown|html] [--component <id>]` — Compatibility Matrix
- `forge-midnight graph [--format mermaid|text]` — the dependency graph
- `forge-midnight compatibility --target <releaseId> [--component <id> --stack <releaseId>...]` — Upgrade Advisor (per-stack evaluation plus ecosystem-wide impact)
- `forge-midnight breaking-changes --component <id> --from <snapshotId> --to <snapshotId>` — Breaking Change Analyzer, across two persisted snapshots (requires `--db`)
- `forge-midnight dashboard` — generate the static HTML dashboard

The CLI's own responsibilities, and only these: argument parsing (`node:util`'s built-in `parseArgs`, no CLI-parsing dependency), a composition root deciding which plugin and storage adapter to wire up (`--db <path>` for a SQLite-backed snapshot history, otherwise an ephemeral in-memory store), formatting output through `interfaces/reporting`, and mapping use-case outcomes to exit codes (`0` compatible/pass, `1` incompatible/fail or blocked, `2` tool error — see [cross-cutting-concerns.md](cross-cutting-concerns.md#error-handling-strategy) for why a tool error is never conflated with a compatibility result). There is no `compass.config` file — every run is explicit about what it's doing via flags, which keeps a single invocation reproducible without a hidden config file to go stale.

## GitHub Action

Ingests the real ecosystem and posts a Markdown compatibility report as a pull request comment, via its own composition root (`interfaces/github-action`):

1. Resolves the pull request from the standard `GITHUB_REPOSITORY` / `GITHUB_EVENT_PATH` Actions contract.
2. Calls the same `IngestSnapshotUseCase` and `BuildCompatibilityMatrixUseCase` the CLI calls, then renders the result with `interfaces/reporting`'s `renderPrComment` — the one place this report's shape is assembled, so the Action and the CLI can never describe the same finding differently.
3. Finds its own prior comment on the pull request by a stable marker and updates it, or creates a new one — a PR accumulates one live report across pushes, never a growing thread of stale ones.
4. Exits non-zero (failing the check) when the matrix contains an incompatibility, and writes a `has-incompatibility` output so a workflow can branch on the result without re-parsing the comment.

Unlike the check-run-against-an-existing-snapshot design this document originally specified, the Action as shipped ingests fresh on every run — there is no persistent, scheduled snapshot service yet for it to query instead. This is a real, documented tradeoff, not an oversight: see [ADR 0012](../adr/0012-interfaces-ingest-fresh-per-invocation.md) for why, its cost, and the future direction that resolves it without an architecture change.

Distributed and versioned independently from the core, the way any GitHub Action is — consumers pin a version the same way they'd pin any other Action, and an Action version bump is itself subject to the same compatibility discipline Compass exists to provide for everything else in the ecosystem. Packaging it for third-party consumption by tag (bundling its dependencies via a tool like `@vercel/ncc`) is the one step not yet done — today it's built and run from within this monorepo.

## Dashboard

Shipped as a `forge-midnight dashboard` command: a single, self-contained, static HTML file — no client-side JavaScript, no external requests, no bundler — built from the same `CompatibilityMatrix`, `Risk[]`, and `Snapshot` shapes the CLI and Action already render (`interfaces/reporting`'s `renderDashboardHtml`). This is deliberately not yet the live-API-backed Dashboard [ADR 0009](../adr/0009-dashboard-uses-public-api.md) anticipates: there is no hosted Query API for it to be a client of, consistent with [roadmap.md](../roadmap.md) sequencing a hosted dashboard behind the CLI and Action being proven first. ADR 0009's principle still holds and constrains the eventual hosted version: a future dashboard swaps this renderer's inputs for live API responses without changing a rendering function in `interfaces/reporting`, and gets no private access to `core/application`, `storage/`, or any plugin that a third-party API consumer wouldn't also have.

## What a New Interface Looks Like

The extension point is the same for all four of these and for anything added later (a Slack integration, a VS Code extension): a new module under `interfaces/`, its own composition root, and calls against the existing `core/application` use cases and [Query API](api-contracts.md). Nothing about adding a new interface ever requires touching `core/`, `plugins/`, or `storage/` — see [repository-structure.md](repository-structure.md#dependency-rules).
