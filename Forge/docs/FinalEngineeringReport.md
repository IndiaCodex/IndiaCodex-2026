# Final Engineering Report

The single reference document for evaluating Forge as an engineering
artifact: what was built, how it's organized, what's tested, what's
known to be missing, and what comes next. Where this document and any
other doc disagree, treat this one as the most current summary and the
other as the detailed source (linked throughout).

## Architecture summary

Forge is a pnpm monorepo of 13 TypeScript packages organized as Clean
Architecture: dependencies point inward only. `domain` (pure entities,
zero dependencies) is depended on by `application` (use cases + ten
typed ports + the `PlatformRegistry` hook bus), which is depended on by
every adapter (an adapter implements exactly the port(s) it's named
for and never depends on another adapter), which is composed by
`platform-sdk` (the `Forge` facade) into the one real presentation layer,
`cli`.

The platform's one non-negotiable rule (per
[ADR-003](adr/ADR-003-ai-as-intent-parser-only.md)): the language model
is restricted to intent classification, parameter extraction, and
narration of already-computed facts. It never generates blockchain
logic — a separate, deterministic template-rendering engine
(`contract-templates`) is the only thing that ever produces Aiken
source. This is enforced by the actual call graph (`GenerateContractUseCase`
never calls `ILanguageModelPort` for source generation, only for
structured extraction), not just documented as a convention.

The full layered breakdown and the build-flow diagram are in
[`docs/Architecture.md`](Architecture.md), kept to three diagrams
deliberately — the detail lives in text and tables, not more diagrams. The
six decisions worth understanding first, each with alternatives
considered and consequences, are in [`docs/adr/`](adr/).

## Folder structure

```
packages/
├── domain/              # pure entities — zero dependencies
├── plugin-api/          # ForgePlugin / PluginContext / PortToken / hooks
├── application/          # 10 ports, 12 use cases, PlatformRegistry
├── plugin-loader/        # dependency-ordered plugin bootstrapping
├── platform-sdk/         # @forge/sdk — the Forge facade
│
├── adapter-aiken/         # real aiken build/check + CIP-57 parsing
├── contract-templates/   # the Forge Engine + 3 templates (escrow, NFT royalty, vesting)
├── adapter-codegen-ts/   # Blueprint -> typed TS SDK
├── adapter-emulator/     # in-memory UTxO ledger
├── adapter-filesystem/   # real IFileSystemPort
├── adapter-providers/    # real CIP-19 address + deployment store
├── adapter-ai/           # real, local ILanguageModelPort
│
└── cli/                  # `forge build` — the one real command
docs/
├── adr/                  # 6 Architecture Decision Records
└── *.md                  # Vision, PRD, Architecture, competitive analysis,
                          # business case, demo plan, dev progress, this report
.github/
├── ISSUE_TEMPLATE/       # bug report, feature request (YAML forms)
└── PULL_REQUEST_TEMPLATE.md
```

Every one of the 13 packages has its own `README.md` — 12 platform/adapter
packages plus `cli`, the one real presentation layer.

## Package dependency graph

```
domain             → (none)
plugin-api         → domain
application        → domain, plugin-api
adapter-aiken      → domain, plugin-api, application
adapter-codegen-ts → domain, plugin-api, application
adapter-emulator   → domain, plugin-api, application
adapter-filesystem → plugin-api, application
adapter-providers  → domain, plugin-api, application
adapter-ai         → domain, plugin-api, application
contract-templates → domain, plugin-api, application
plugin-loader      → domain, plugin-api, application
platform-sdk       → all of the above (auto-registers built-ins)
cli                → platform-sdk + every adapter (composition only)
```

No adapter depends on another adapter. `cli` contains no business logic —
every one of its ~320 lines across 9 files is argument parsing, plugin
wiring, and progress narration built from hooks the platform already
fires.

## Feature matrix

| Feature                                                                                                  | Package                                      | Status                                                        | Test coverage                                                                                 |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Real Aiken compilation (`aiken build`/`check`)                                                           | `adapter-aiken`                              | ✅ Delivered                                                  | Fixture-based unit tests + real integration test                                              |
| CIP-57 blueprint parsing                                                                                 | `adapter-aiken`                              | ✅ Delivered                                                  | Parsed against JSON captured from a real compiler run                                         |
| Aiken project scaffolding (`aiken.toml`)                                                                 | `adapter-aiken`                              | ✅ Delivered                                                  | Covered by the integration test                                                               |
| Deterministic contract generation                                                                        | `contract-templates`                         | ✅ Delivered (3 templates: escrow, NFT royalty mint, vesting) | Unit + integration tested                                                                     |
| Typed TS SDK generation from blueprint                                                                   | `adapter-codegen-ts`                         | ✅ Delivered                                                  | Unit-tested against a real-shaped fixture                                                     |
| In-memory UTxO emulator                                                                                  | `adapter-emulator`                           | ✅ Delivered (generic scenario check — see limitations)       | Unit-tested                                                                                   |
| Real `IFileSystemPort`                                                                                   | `adapter-filesystem`                         | ✅ Delivered                                                  | Unit-tested against real temp-dir I/O                                                         |
| Real CIP-19 deployment address                                                                           | `adapter-providers`                          | ✅ Delivered                                                  | Round-trip encode/decode test                                                                 |
| Local deployment-manifest store                                                                          | `adapter-providers`                          | ✅ Delivered                                                  | Unit-tested against real temp-dir I/O                                                         |
| Intent classification (local, no hosted API)                                                             | `adapter-ai`                                 | ✅ Delivered                                                  | Unit-tested                                                                                   |
| Parameter extraction (local)                                                                             | `adapter-ai`                                 | ✅ Delivered                                                  | Unit-tested                                                                                   |
| Deterministic-fact narration                                                                             | `adapter-ai`                                 | ✅ Delivered                                                  | Unit-tested                                                                                   |
| Confidence-gated template matching (rejects low-confidence guesses, configurable via `--min-confidence`) | `application`                                | ✅ Delivered                                                  | Unit-tested (application + CLI) + real end-to-end integration test                            |
| `forge build "<description>"` CLI                                                                        | `cli`                                        | ✅ Delivered                                                  | Unit-tested (arg parsing) + real end-to-end integration test                                  |
| Plugin system (ports + hooks)                                                                            | `plugin-api`, `plugin-loader`, `application` | ✅ Delivered                                                  | Unit-tested (topological sort, cycle/missing-dep detection, context scoping)                  |
| Explainability (inline "why" output)                                                                     | `application`                                | ✅ Delivered                                                  | Unit-tested                                                                                   |
| Review + docs generation                                                                                 | `application`                                | ✅ Delivered                                                  | Unit-tested                                                                                   |
| Deployment tracking (manifest)                                                                           | `application`, `adapter-providers`           | ✅ Delivered                                                  | Unit + integration tested                                                                     |
| NFT minting policy with royalty enforcement                                                              | `contract-templates`                         | ✅ Delivered                                                  | Unit + real integration test (real Aiken compilation)                                         |
| Token Vesting                                                                                            | `contract-templates`                         | ✅ Delivered                                                  | Unit + real integration test (real Aiken compilation)                                         |
| eUTxO vulnerability rule engine (`ai-testgen`)                                                           | —                                            | ❌ Not built                                                  | `GenerateSecurityTestsUseCase` correctly returns an empty report with no generator registered |
| Real off-chain tx building (`ITxBuilderPort`)                                                            | `adapter-providers` (stub)                   | ❌ Not built                                                  | Stub tested to confirm it fails loudly, not silently                                          |
| Real Plutus/UPLC execution in the emulator                                                               | —                                            | ❌ Not built                                                  | N/A                                                                                           |
| A fourth contract template and beyond                                                                    | —                                            | ❌ Not built                                                  | N/A                                                                                           |
| Real local devnet (`adapter-devnet`)                                                                     | —                                            | ❌ Not built                                                  | N/A                                                                                           |
| Additional chain providers (Maestro, Ogmios+Kupo)                                                        | —                                            | ❌ Not built                                                  | N/A                                                                                           |
| Hosted-LLM backend for `adapter-ai`                                                                      | —                                            | ❌ Not built (by design for now)                              | N/A                                                                                           |
| Additional presentation layers (VS Code, web)                                                            | —                                            | ❌ Not built                                                  | N/A                                                                                           |

## Test summary

- **150 fast unit tests, 43 test files** — fully offline, complete in
  under 4 seconds (`pnpm test`). Fixtures for external tool output
  (Aiken's CIP-57 JSON, `aiken check`'s test-report JSON) were captured
  verbatim from real runs, not hand-written guesses.
- **8 integration tests, 3 test files** — real Aiken compiler, real
  network access (to fetch `aiken-lang/stdlib`), complete in under a
  minute (`pnpm test:integration`), deliberately excluded from the
  default fast suite via `vitest.integration.config.ts`.
- **Verified from a fully clean workspace**: `node_modules`, every
  package's `dist/`, and all `.tsbuildinfo` files were removed and
  rebuilt from the committed lockfile during this polish pass — `pnpm
install --frozen-lockfile && pnpm build && pnpm test && pnpm
test:integration` all pass from that state, and `forge build` was
  re-run from a fresh scratch directory afterward to confirm the demo
  reproduces with zero manual intervention.
- **Not yet in CI**: `pnpm test:integration` runs locally only (see
  `docs/ReleaseProcess.md`); GitHub Actions CI runs the fast suite.

## Known limitations

(Full detail and reasoning in [`docs/ProductionReadiness.md`](ProductionReadiness.md).)

1. `ai-testgen` (the eUTxO vulnerability rule engine) is architected for
   but not implemented — the single largest gap versus the original
   pitch, disclosed everywhere it's relevant.
2. `adapter-emulator` performs a generic spendable-UTxO check, not a
   real per-validator redeemer simulation — no transaction-building or
   Plutus execution engine exists yet.
3. Three contract templates exist (`escrow-milestone`,
   `nft-minting-royalty`, `token-vesting`) — a real, if still small,
   library relative to the breadth of real-world Cardano contract shapes.
4. `ITxBuilderPort`'s only implementation is an honest stub that
   rejects if called (and is never called by the shipped template).
5. No third-party security audit of the platform or the shipped
   template.
6. `pnpm test:integration` is not wired into CI.
7. Aiken's `Int` maps to TypeScript `number`, not `bigint`, in generated
   SDKs — a reasonable simplification, revisit if a template needs
   larger values.

## Suggested v1.1 roadmap

In priority order, reasoning included:

1. **`ai-testgen`** — closes the largest gap between the pitch and the
   delivered platform. The generator port and pipeline already exist;
   this is "write the rule engine," not "redesign anything."
2. **A real `ITxBuilderPort` implementation** (a real off-chain
   transaction-building integration) — the prerequisite for
   `adapter-emulator` to evaluate actual redeemer logic instead of a
   generic check, and for `forge build` to eventually submit to a live
   network rather than only computing an address.
3. ~~A second contract template~~ — **done**: `nft-minting-royalty` and
   `token-vesting` shipped, proving the template-authoring process (per
   [ADR-004](adr/ADR-004-template-engine.md)) scales past "the one
   template we built the pipeline around." The next test in this space is
   a template whose intent-classifier keywords meaningfully _overlap_
   with an existing category's — the current three have cleanly distinct
   vocabularies, so keyword-coverage scoring hasn't been stressed yet.
4. **Wire `pnpm test:integration` into CI** as a separate, non-blocking
   job — closes the gap between "passes locally" and "verified on every
   PR."
5. **`adapter-devnet`** (real local devnet) and **`adapter-providers`
   expansion** (Maestro, Ogmios+Kupo) — for integration-tier testing
   against real ledger semantics before any real deployment.
6. **An optional hosted-LLM backend for `adapter-ai`**, behind the same
   `ILanguageModelPort` — for teams that want it, never required.
7. **Additional presentation layers** (VS Code extension, web
   playground) built purely on `@forge/sdk` — validates that the CLI
   truly is "just one interface," per the platform's original design
   goal.

See [`docs/PRD.md`](PRD.md)'s "Future roadmap" section for the same list
in product-requirement terms, and [`docs/ReleaseProcess.md`](ReleaseProcess.md)
for how any of this would actually ship (Changesets, semver, manual
publish trigger).
