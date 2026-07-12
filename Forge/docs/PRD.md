# Product Requirements Document

See [Vision.md](./Vision.md) for problem framing and [Architecture.md](./Architecture.md)
for how these requirements are implemented.

## Users

| Persona                                           | Description                                                                                                                          | Primary need                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Aiken contract developer** (primary)            | Individual hacker or small team building a dApp on Cardano, comfortable with TypeScript, new to or moderately experienced with Aiken | Fast path from idea to a tested, typed, deployable contract                                           |
| **Tooling/education provider** (secondary)        | Bootcamps, Catalyst-funded teams, hackathon organizers                                                                               | A standard onboarding path they can teach and rely on instead of maintaining bespoke starter kits     |
| **Security-conscious team / auditor** (secondary) | Teams preparing for audit, or auditors reviewing incoming code                                                                       | Repeatable, automated scaffolding of eUTxO-specific security tests as a baseline before manual review |
| **Plugin author** (tertiary, post-MVP)            | Third-party developer extending the platform                                                                                         | A stable, documented port/hook API to add new providers, generators, or commands without forking core |

## User journeys

Journey 1 is the one delivered, real, end-to-end CLI experience today.
Journeys 2–6 describe the underlying use cases that already exist and are
exercised by journey 1 and by the test suite, but are not yet each
individually exposed as their own CLI subcommand — that CLI-surface work
(`forge compile`, `forge test`, `forge deploy`, `forge explain` as
standalone commands) is scoped, not yet built. See
[FinalEngineeringReport.md](./FinalEngineeringReport.md) for the exact
delivered-vs-planned line.

1. **AI-native project creation (the flagship journey, delivered).**
   `forge build "Build an escrow smart contract with milestone-based
payments"` interprets the request, deterministically selects and
   parameterizes a matching contract template, renders real Aiken source,
   compiles it with the real Aiken compiler, generates the typed SDK,
   runs a functional test against the in-memory emulator, generates
   documentation, and computes a real deployment address plus a versioned
   manifest — one command, one sentence in, a complete project out. The
   language model never writes the Aiken source itself (see FR9–FR11); it
   only interprets intent and narrates already-computed facts.

2. **Iterative contract development.** Editing a validator and
   regenerating its SDK is available today through `application`'s
   `CompileUseCase`/`GenerateSdkUseCase` (exercised directly in tests and
   internally by journey 1); exposing `forge compile` and
   `forge generate:sdk` as their own CLI subcommands for an existing,
   hand-edited project is scoped future CLI surface, not yet built.

3. **Testing before real funds are at risk.** `RunTestsUseCase` runs
   native Aiken unit/property tests and an emulator-based functional
   check together with one unified report; `forge build` calls it
   internally today. A standalone `forge test` command for an existing
   project is scoped, not yet built.

4. **Security hardening before deploy.** The `GenerateSecurityTestsUseCase`
   and its `Rationale`-carrying generator contract exist and are wired
   into `forge build` already — but no generator is registered yet (that's
   `ai-testgen`, the eUTxO vulnerability rule engine), so this journey
   currently, correctly, produces an empty report rather than fabricated
   findings. This is the single largest gap between the current build and
   the original vision.

5. **Understanding why, not just what.** `forge.explain(...)` surfaces
   the deterministic reasoning behind a template choice or a parameter,
   and is printed automatically at the end of every `forge build` run
   today ("Why this template" / "Why these parameters"). A standalone
   `forge explain <artifact>` command for inspecting an already-built
   project on demand is scoped, not yet built.

6. **Deployment with confidence and auditability.** `DeployUseCase`
   computes a real script address and writes a versioned deployment
   manifest; `forge build` calls it internally today, targeting whichever
   `--network` was requested (address computation only — no live
   transaction submission network exists yet). A standalone
   `forge deploy` command for an already-built project is scoped, not yet
   built.

7. **Extending the platform.** A plugin author implements a port (e.g.
   `IChainProviderPort` for a new backend) in a `forge-plugin-*` package.
   The plugin API this depends on is real and already dogfooded by every
   built-in adapter; a config-file-driven (`forge.config.ts`) discovery
   mechanism for third-party plugins is scoped, not yet built — today,
   plugins are wired together in code (see `packages/cli/src/commands/build.ts`
   for the reference example).

## Functional requirements

| ID   | Requirement                                                                                                                                                                                                                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR1  | Scaffold new Aiken + TypeScript projects from templates (`forge init`)                                                                                                                                                                                                                                                   |
| FR2  | Compile Aiken validators and parse their CIP-57 blueprint into a typed domain model (`forge compile`)                                                                                                                                                                                                                    |
| FR3  | Generate a strongly-typed TypeScript SDK (datum/redeemer types, typed tx-builder helpers) from a blueprint (`forge generate:sdk`)                                                                                                                                                                                        |
| FR4  | Run native Aiken unit/property tests and TypeScript emulator-based integration tests together with unified reporting (`forge test`)                                                                                                                                                                                      |
| FR5  | Detect known eUTxO vulnerability classes (double satisfaction, missing signer check, unbounded value, missing validity interval, unpinned token authenticity, missing min-ADA handling) and generate targeted tests (`forge ai:gen-security-tests`)                                                                      |
| FR6  | Compute deployment addresses, submit setup transactions, and persist versioned deployment manifests per network (`forge deploy`)                                                                                                                                                                                         |
| FR7  | Discover, load, order, and bind third-party or built-in implementations to platform ports; allow plugins to contribute CLI commands and lifecycle hooks without core changes                                                                                                                                             |
| FR8  | Support a single `forge.config.ts` defining networks, providers, active plugins, and test fixtures                                                                                                                                                                                                                       |
| FR9  | Parse a natural-language project description into structured intent (a template category and a confidence score)                                                                                                                                                                                                         |
| FR10 | Deterministically select a contract template from intent, extract structured parameters from the description against that template's declared parameter schema, and validate them before use; reject outright, with no project generated, when no template matches above a configurable minimum confidence (default 0.6) |
| FR11 | Deterministically render Aiken source from a template and validated parameters (the "Forge Engine") — never from unconstrained language-model output                                                                                                                                                                     |
| FR12 | Run an AI-assisted review pass over a generated contract and its blueprint, producing a structured review report grounded in the same deterministic facts the platform already computed                                                                                                                                  |
| FR13 | Explain any generated artifact (template choice, parameter, validator, test) on demand: surface the deterministic reason it exists, including eUTxO, CIP-57, and security considerations, narrated in plain language                                                                                                     |
| FR14 | Generate project documentation (README and usage guide) from the blueprint, generated contract, and review report                                                                                                                                                                                                        |

## Non-functional requirements

| ID   | Requirement                                                                                                                                                                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR1 | Strong typing end-to-end — TypeScript strict mode, no `any` across public package boundaries                                                                                                                                                                     |
| NFR2 | Deterministic, offline-first core — `init`, `compile`, `test`, and `ai:gen-security-tests` never require a hosted/paid service                                                                                                                                   |
| NFR3 | Modularity — any adapter is replaceable without touching `domain`, `application`, or `cli`                                                                                                                                                                       |
| NFR4 | Test coverage — unit tests per package, plus at least one full-flow integration test in CI                                                                                                                                                                       |
| NFR5 | Documentation — every public package has a README; architecture docs are kept current as the source of truth                                                                                                                                                     |
| NFR6 | Performance — the full emulator test suite for the example project completes in seconds, not minutes                                                                                                                                                             |
| NFR7 | Security — no secrets or private keys are ever logged; deployment manifests never contain private key material                                                                                                                                                   |
| NFR8 | Extensibility without forking — 100% of built-in functionality is reachable through the same plugin API a third party would use                                                                                                                                  |
| NFR9 | The language model is never responsible for generating blockchain logic — it is limited to structured intent/parameter extraction and narration of already-computed deterministic facts; all Aiken source comes from the deterministic template-rendering engine |

## MVP scope

**Delivered (verified against the real Aiken compiler, not fakes):**

- `domain`, `plugin-api`, `application` packages with real ports and use cases, including
  `ILanguageModelPort` and `IContractTemplateEnginePort`
- `adapter-aiken` — real `aiken build`/`aiken check` invocation and real CIP-57 parsing
- `adapter-codegen-ts` — typed `Datum`/`Redeemer` interfaces and metadata per validator (no
  `buildTx()` helper yet — that needs a real off-chain tx-building pipeline; deferred, see below)
- `adapter-emulator` — a real, self-built in-memory UTxO ledger (emulator-only, no live network;
  originally sketched as a Lucid Evolution wrapper, built instead as a lightweight ledger to avoid
  an unnecessary heavy dependency)
- `adapter-filesystem` — a real `IFileSystemPort`, added when no other planned package turned out
  to own this generic a concern
- `adapter-providers` — real CIP-19 deployment-address computation and a local JSON
  deployment-manifest store (added beyond the original plan so "deployment artifacts" in the demo
  would be backed by something real)
- `adapter-ai` — `ILanguageModelPort` implementation; **local-only** (no hosted backend was built —
  a deliberate reliability choice for the demo, not a placeholder; see ADR-003)
- `contract-templates` — the deterministic Forge Engine and three audited templates
  (Escrow with Milestone Payments; NFT Minting with Royalties; Token Vesting), each
  verified to compile against the real Aiken compiler
- `plugin-loader` + `platform-sdk` wiring the above as built-in plugins
- `cli` — one real command, `forge build "<description>"`, running the full
  generate → scaffold → compile → SDK → test → review → document → deploy
  pipeline (generation runs before scaffolding specifically so a
  low-confidence match is rejected before any file is written — see
  [ADR-006](adr/ADR-006-confidence-gated-template-matching.md))

**Explicitly out of scope for the hackathon submission:**

- `ai-testgen` (the deterministic eUTxO vulnerability rule engine) — no generator is registered
  today, so `GenerateSecurityTestsUseCase` correctly returns an empty, passing report rather than
  fabricating findings
- Real local devnet or testnet/mainnet deployment (`forge deploy` targets the emulator only)
- Chain providers beyond the CIP-19 address computation in `adapter-providers` (no Maestro,
  Ogmios+Kupo, or Blockfrost integration)
- Real off-chain transaction building and Plutus execution (`adapter-emulator`'s scenario check is
  generic — see its README — not a per-validator redeemer simulation)
- A fourth contract template or beyond the three shipped (escrow, NFT minting royalty, token vesting)
- Open-ended (non-template-constrained) contract generation
- Any additional presentation layer beyond the CLI (VS Code extension, web playground, GitHub Action)
- A hosted-LLM backend for `adapter-ai` (the port supports one; none is implemented)

## Future roadmap

See the roadmap table in [Architecture.md](./Architecture.md#roadmap) for the phased,
dated view. In product terms, the next investments after MVP are, in priority order:

1. `ai-testgen` — the deterministic eUTxO vulnerability rule engine (double satisfaction, missing signer checks, unbounded value, etc.), registered as a real generator against `GenerateSecurityTestsUseCase`, which today correctly returns an empty report because none exists
2. A real off-chain transaction-building pipeline (a real `ITxBuilderPort`) and Plutus execution in `adapter-emulator`, so scenario checks become per-validator redeemer simulations instead of a generic spendable-UTxO check
3. `adapter-devnet` — real local devnet (Yaci DevKit / `cardano-testnet`) for integration-tier testing against real ledger semantics before testnet/mainnet deploy
4. `adapter-providers` expansion — Maestro, Ogmios+Kupo alongside the current CIP-19 address computation
5. An optional hosted-LLM backend for `adapter-ai`, behind the same `ILanguageModelPort`, for teams that want it — never required
6. `apps/vscode-extension` and `apps/web-playground`, both built purely on `platform-sdk`
7. A reusable `forge-deploy` GitHub Action for CI/CD pipelines
8. A community plugin registry / curated list under the `forge-plugin-*` npm convention
9. Additional SDK codegen targets (e.g. Python) if community demand emerges
