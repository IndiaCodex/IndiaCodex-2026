# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/); dates are omitted while the project is unreleased.

## [Unreleased]

### Added — Presentation

- `docs/presentation/Midnight-Compass-Presentation.pptx`: a 12-slide hackathon presentation deck with speaker notes on every slide. Built from real repository assets only — the actual dashboard, terminal-demo, and CLI-help screenshots, and simplified renders of the same architecture and ecosystem-coverage diagrams used in the README. Verified by converting to PDF with LibreOffice and rendering every slide to confirm no layout overflow.

### Fixed

- Removed three unused workspace dependency declarations found during a final release audit: `interfaces/cli` declared `@compass/plugin-sdk` without importing it; `storage/adapters/memory` and `storage/adapters/sqlite` both declared `@compass/application` without importing it. Matching unnecessary TypeScript project references removed too. No behavior change — `npm run ci` and `npm run demo` verified from a clean `npm install` afterward.

### Added — Presentation & Proof

- `npm run demo` (`scripts/demo.mjs`): an offline demo that ingests the real, recorded Midnight ecosystem fixture with zero network calls and zero GitHub API rate-limit risk — the same engine every other command uses, replayed from data instead of a live call.
- Real, unedited screenshots (`docs/assets/`) of the dashboard, the terminal demo, and `forge-midnight --help`, embedded directly in the README and `docs/demo.md` — not links, not mockups.
- README rewritten to lead with the single most concrete piece of evidence this project has: `example-counter` (Midnight's own reference template) is currently incompatible with the current `midnight-js` release, found by Compass itself.
- `docs/README.md`: a documentation index for anyone browsing the `docs/` folder directly on GitHub.
- Polished architecture and ecosystem-coverage Mermaid diagrams (colored, GitHub-native, no external tooling to view).

### Added — Product Surface

- `interfaces/reporting`: shared Markdown/HTML rendering for the compatibility matrix, dependency graph, breaking-change report, upgrade-advisor report, PR comment, and a static HTML dashboard.
- `interfaces/cli` (`forge-midnight`): `analyze`, `matrix`, `graph`, `compatibility`, `breaking-changes`, `dashboard` commands, with a SQLite (`--db`) or in-memory snapshot backend.
- `interfaces/github-action`: ingests the real Midnight ecosystem on a pull request and posts (or updates) a Markdown compatibility report as a PR comment, failing the check on a found incompatibility.
- Two new `dependency-cruiser` rules keeping the CLI and Action from importing each other, and keeping `core/`, `plugins/`, `storage/` from ever importing `interfaces/`.
- [ADR 0012](docs/adr/0012-interfaces-ingest-fresh-per-invocation.md): documents that both interfaces ingest fresh per invocation rather than querying a persistent snapshot service, and the future direction that removes that limitation.
- Repository polish: `LICENSE` (Apache-2.0), `CONTRIBUTING.md`, `SECURITY.md`, this changelog, `docs/faq.md`, `docs/demo.md`, and `description`/`license` metadata on every workspace package.

### Added — Midnight Ecosystem Integration

- `plugins/midnight`: a real source adapter and two capability extractors ingesting the `midnightntwrk` GitHub organization (`midnight-js`, `compact`, `midnight-node`, `example-counter`, `midnight-docs`, `create-mn-app`) via the GitHub REST API, plus a Compact-toolchain release parser and an initial compatibility rule pack.
- [ADR 0011](docs/adr/0011-declared-dependency-constraints-are-first-class-compatibility-signal.md): a release's own declared dependency constraint is evaluated as a compatibility signal automatically, not only via rule-pack rules.
- An end-to-end golden-snapshot test against a fixture recorded once from the real GitHub API.

### Added — Compatibility Engine

- `core/domain`: domain model (`Repository`, `Component`, `Release`, `Artifact`, `Dependency`, `Capability`, `Constraint`, `Evidence`, `CompatibilityRule`, `CompatibilityRelationship`, `BreakingChange`, `Risk`, `Recommendation`, `Snapshot`), rule engine, evidence engine, knowledge graph, compatibility engine, risk engine, recommendation engine, and a dependency-free semver implementation.
- `core/application`: use cases (`IngestSnapshot`, `BuildCompatibilityMatrix`, `EvaluateUpgrade`, `DetectBreakingChanges`, `ComputeRisk`, `AnalyzeUpgradeImpact`, `AnalyzeBreakingChangeImpact`) and the ports every plugin, storage adapter, and interface depends on.
- `core/testing`: shared builders, in-memory fakes, and conformance suites reused by every plugin and adapter's own test suite.
- `plugins/plugin-sdk` and `storage/storage-sdk`: the plugin and storage extension-point contracts.
- `storage/adapters/memory` and `storage/adapters/sqlite`: `SnapshotRepositoryPort` implementations.
- `dependency-cruiser`-enforced Clean Architecture boundary (ADR 0003), GitHub Actions CI (`npm run ci`).

### Added — Foundation

- Project vision, problem statement, business case, use cases, and roadmap.
- Full implementation-language-agnostic architecture specification (`docs/architecture/`).
- Eleven initial ADRs recording the domain model, plugin model, rule model, evidence model, snapshot model, storage strategy, dashboard/API boundary, and implementation stack decisions.
