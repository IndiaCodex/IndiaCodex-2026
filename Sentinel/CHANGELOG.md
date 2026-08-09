# Changelog

All notable changes to this project are documented in this file. Full
narrative release notes (highlights, upgrade notes, verification steps) live
in [`docs/releases/`](docs/releases/); this file is the terse,
chronological summary in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format. This project has not yet adopted [Semantic Versioning](https://semver.org/)
strictly — see [`docs/roadmap.md`](docs/roadmap.md) for what "1.0" would mean.

## [Unreleased]

### Changed

- Consolidated nine near-identical `vitest.config.ts` files into a single
  shared factory (`vitest.shared.ts`).
- Removed an unused direct dependency (`@sentinel/explainability`) from
  `apps/server` — it was only ever consumed transitively through
  `@sentinel/application`.
- README rewritten to a full flagship-repository structure (problem
  statement, architecture overview, repository structure, deterministic
  engineering principles, security summary, acknowledgements).
- Screenshot set recaptured at a single consistent 1440×900 viewport for
  every image (two were previously inconsistent full-page captures).

- `docs/architecture-validation.md`'s doc-comment correction: `StoragePort`
  claimed to be "implemented by interchangeable SQLite and PostgreSQL
  adapters" — no PostgreSQL adapter exists yet; corrected to state current
  reality and roadmap status separately.

### Added

- `CODEOWNERS`, `FUNDING.yml` (placeholder), `SUPPORT.md`.
- Project logo/wordmark (`docs/assets/`), theme-aware via `<picture>`.
- `docs/architecture-validation.md` — a verification pass (dependency
  direction, cyclic-import check via `madge`, port-interface leak check)
  confirming the architecture boundaries documented in
  `docs/architecture.md` actually hold in the current source.
- `docs/github-setup.md` — repository description, GitHub Topics, and
  social preview recommendations for once this repository has a real
  GitHub remote.
- A twelve-slide presentation deck (`presentation/Sentinel-RC1-Presentation.pptx`,
  generated, not tracked — see `presentation/README.md`) with real
  screenshots and Mermaid diagrams rendered to images, plus speaker notes
  on every slide.

### Fixed

- A tagline that had drifted from the canonical product tagline in the
  hackathon presentation deck's title slide.
- `docs/roadmap.md`'s phase table, which had fallen behind the phases the
  README already described as delivered.

## [0.1.0] — 2026-07-15

First public release. See
[`docs/releases/v0.1.0.md`](docs/releases/v0.1.0.md) for the full write-up.

### Added

- Execution Capture, Execution Journal (hash-chained, append-only), Replay
  Engine, Verification Engine, Engineering Explainability, and portable
  Execution Artifact / Audit Export.
- Live Masumi payment enrichment (`MasumiAdapterPort`) during capture, not
  as a batch job.
- Web console: Dashboard, Executions list, and five per-execution tabs.
- SQLite and in-memory `StoragePort` adapters, validated by one shared
  contract test suite.
- Four-scenario seeded demo, runnable from a single `pnpm demo` command.
- MIT license, Architecture Decision Records, and full documentation set.
