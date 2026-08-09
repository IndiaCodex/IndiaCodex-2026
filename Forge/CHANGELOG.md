# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project intends to adhere to [Semantic Versioning](https://semver.org/)
once its first package is published (see [`docs/FinalEngineeringReport.md`](docs/FinalEngineeringReport.md)
for the release strategy). Every package in this monorepo is currently at
`0.0.0` — nothing has been published to npm yet.

## [Unreleased]

### Changed — template presentation polish

- `ContractTemplate` gained an optional `useCases` field, populated for
  all three templates; `LowConfidenceTemplateMatchError` now renders a
  numbered "Supported Smart Contract Templates" list with each template's
  use cases instead of a flat one-liner per template.
- Template display names shortened ("Escrow with Milestone Payments",
  "NFT Minting with Royalties", "Token Vesting") — cosmetic only; `id` and
  `category` values are unchanged.
- `README.md` gained a "Traditional development vs. Forge" comparison
  table.

### Added — NFT minting and token vesting templates

- `@forge/contract-templates` — two new audited templates, each verified
  against the real Aiken compiler: `nft-minting-royalty` (a `mint`
  validator enforcing a royalty payment on every mint) and `token-vesting`
  (a `spend` validator releasing funds across a configurable number of
  time-gated tranches). The template library is now three templates, up
  from one.
- `@forge/adapter-ai` — new intent-classifier keyword categories for both,
  so `forge build` correctly disambiguates among all three templates from
  natural language.
- 10 new tests, including two real end-to-end integration tests that
  compile both new templates with the actual Aiken compiler.

### Changed — confidence-gated template matching

- `SelectTemplateUseCase` now rejects with `LowConfidenceTemplateMatchError`
  (naming the detected confidence, the required threshold, and every
  currently supported template) instead of silently falling back to the
  first registered template when nothing matches confidently enough.
  `BuildFromDescriptionUseCase` now runs template selection before
  scaffolding, so a rejected description creates no project directory at
  all. The threshold defaults to 0.6 and is configurable via `forge build`'s
  new `--min-confidence <0-1>` flag.

### Added — Phase 4: `adapter-ai`, `adapter-providers`, and the `forge` CLI

- `@forge/adapter-ai` — a real, local, dependency-free `ILanguageModelPort`
  implementation (intent classification, parameter extraction, and
  rationale narration; never generates blockchain logic — see
  [ADR-003](docs/adr/ADR-003-ai-as-intent-parser-only.md)).
- `@forge/adapter-providers` — real CIP-19 bech32 deployment-address
  computation and a local, versioned deployment-manifest store.
- `@forge/cli` — the `forge build "<description>"` command: the first
  real presentation layer, composing every adapter into a live,
  narrated, end-to-end run.

### Added — Phase 3: real Aiken, templates, codegen, and emulator

- `@forge/adapter-aiken` — real `aiken build`/`aiken check` invocation
  and real CIP-57 blueprint parsing.
- `@forge/contract-templates` (the Forge Engine) — deterministic
  template rendering, with one audited template: escrow with milestone
  payments.
- `@forge/adapter-codegen-ts` — generates a typed TypeScript SDK from a
  real CIP-57 blueprint.
- `@forge/adapter-emulator` — a real, self-built in-memory UTxO ledger.
- `@forge/adapter-filesystem` — a real `IFileSystemPort`.
- Corrected the `domain` package's `Blueprint` type to match the real
  CIP-57 shape emitted by the actual Aiken compiler (Phase 2's version
  was an educated guess; Phase 3 verified it against the real tool and
  fixed it).

### Added — Phase 2: platform core

- `@forge/domain`, `@forge/plugin-api`, `@forge/application`,
  `@forge/plugin-loader`, `@forge/sdk` — the platform's Clean
  Architecture core: entities, the plugin/hook contract, ten typed
  ports, the `PlatformRegistry`, twelve use cases, and the `Forge`
  facade.
- The AI-native pivot: `ILanguageModelPort` and
  `IContractTemplateEnginePort`, `GenerateContractUseCase`,
  `SelectTemplateUseCase`, `ExplainUseCase`, and the
  `BuildFromDescriptionUseCase` orchestrator — with the language model
  strictly limited to intent parsing, parameter extraction, and
  narration (never code generation).

### Added — Phase 1: workspace

- pnpm monorepo, strict TypeScript project references, ESLint (flat
  config, type-aware), Prettier, Husky + lint-staged, Changesets, and a
  GitHub Actions CI pipeline.

See [`docs/DevelopmentProgress.md`](docs/DevelopmentProgress.md) for the
full phase-by-phase build log, including what was verified and how.
