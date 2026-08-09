# Release Process, Labels, and Versioning

This document is the reference for how Forge intends to label issues, cut
releases, and version packages once it moves past the hackathon
submission stage. Nothing here has been executed yet — no package has
been published, no labels have been created on a live repository. This is
the documented plan, not a log of actions taken (see
[`docs/DevelopmentProgress.md`](DevelopmentProgress.md) for that).

## GitHub labels

To be created once the repository is live. Proposed scheme, kept small
deliberately:

| Label                                                                  | Purpose                                                                                              |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `type: bug`                                                            | Something doesn't work as documented                                                                 |
| `type: enhancement`                                                    | A new capability or improvement                                                                      |
| `type: docs`                                                           | Documentation-only change                                                                            |
| `status: triage`                                                       | Newly opened, not yet reviewed                                                                       |
| `status: needs-discussion`                                             | Touches `domain`/`plugin-api`/`application`, or the plugin API surface — needs agreement before a PR |
| `status: blocked`                                                      | Waiting on an external dependency or another issue                                                   |
| `good first issue`                                                     | Scoped, well-understood, suitable for a first-time contributor                                       |
| `help wanted`                                                          | Maintainers would like community help on this specifically                                           |
| `area: adapter-aiken` / `area: cli` / `area: contract-templates` / ... | One per package, applied as needed for filtering                                                     |

Labels are intentionally few. Adding more only when a real, recurring
need for a distinction shows up — not speculatively.

## Semantic Versioning

Every package (`@forge/domain`, `@forge/sdk`, `@forge/cli`, etc.) follows
[Semantic Versioning 2.0.0](https://semver.org/) independently once
published:

- **MAJOR** — a breaking change to a package's public API. For
  `@forge/application` and `@forge/plugin-api` specifically, this
  includes any change to a port's method signature or to the
  `ForgePlugin`/`PluginContext` shape — those are the platform's stable
  contract (see [ADR-001](adr/ADR-001-clean-architecture.md) and
  [ADR-002](adr/ADR-002-plugin-architecture.md)).
- **MINOR** — a backward-compatible addition (a new port, a new use
  case, a new contract template, a new CLI flag).
- **PATCH** — a backward-compatible fix.

All packages currently sit at `0.0.0` — nothing has shipped a `1.0.0` yet,
intentionally: per [Semantic Versioning's own guidance](https://semver.org/#spec-item-4),
`0.y.z` signals "anything may change at any time" while the platform is
still this new. The plugin API surface (`plugin-api`, the port
definitions in `application`) is the one area we'd want to stabilize
_before_ committing to `1.0.0` for the packages built on it.

## Release strategy

Versioning and publishing are managed with
[Changesets](https://github.com/changesets/changesets), already
configured in this repository (`.changeset/config.json`, `access: public`).
The intended flow, once the project starts publishing:

1. A PR that changes a published package's behavior includes a changeset
   (`pnpm changeset`) describing the change and its semver bump.
2. Changesets accumulate on `main` until a maintainer runs
   `pnpm version-packages`, which bumps versions and updates each
   package's `CHANGELOG.md` (Changesets generates and maintains
   per-package changelogs; this root `CHANGELOG.md` remains the
   human-curated, whole-project narrative).
3. `pnpm release` (`pnpm build && changeset publish`) publishes the
   bumped packages to npm.

This is deliberately a manual, maintainer-triggered process for now —
**no CI workflow automatically publishes on merge to `main`.** Automating
that (a `release.yml` GitHub Actions workflow) is a reasonable next step
once there's a real cadence of changes to publish, not before; see
[`docs/FinalEngineeringReport.md`](FinalEngineeringReport.md) for where
this sits in the roadmap.

## Branching

`main` is the only long-lived branch. Feature work happens on short-lived
branches merged via PR; there is no separate `develop` branch — the
monorepo's own package versions (once published) are the release
boundary, not a branching strategy.
