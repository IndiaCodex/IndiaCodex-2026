# Development Progress

This file is a running, phase-by-phase log of what has actually been built,
kept for anyone reviewing the project's status without reading the codebase
directly. It is updated once per completed milestone, never edited
retroactively to look cleaner than it was — if a decision was revisited
later, that shows up as a new entry, not a rewritten old one.

For the reasoning behind the platform's shape, see
[Vision.md](./Vision.md), [PRD.md](./PRD.md), and [Architecture.md](./Architecture.md).
This file only tracks build status against that plan.

---

## Phase 1 — Workspace Initialization

**Status: complete, approved pending first commit.**

### 1. What was built

A pnpm monorepo shell with no product code yet — purely the toolchain
everything else will be built on:

- Git repository initialized (`main` branch).
- pnpm workspace (`pnpm-workspace.yaml`) scoped to `packages/*` and `examples/*`.
- Node 22 LTS pinned (`.nvmrc`, `engines.node`), pnpm pinned exactly via
  `packageManager` in the root `package.json`.
- Shared strict TypeScript config (`tsconfig.base.json`) that every future
  package will extend — strict mode plus `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noEmitOnError`, and `composite: true` for project
  references.
- ESLint (flat config, `eslint.config.js`) with `typescript-eslint`'s
  type-aware rule set, scoped to real TypeScript sources under
  `packages/**` and `examples/**`.
- Prettier, wired as the single source of formatting truth (ESLint's
  stylistic rules are disabled via `eslint-config-prettier`).
- Husky + lint-staged: a real `pre-commit` hook that runs ESLint `--fix`
  and Prettier `--write` on staged files.
- Changesets, initialized via its own CLI, configured for public npm
  releases.
- Vitest as the test runner, with V8 coverage configured.
- GitHub Actions CI (`.github/workflows/ci.yml`): install → format check →
  lint → build → test, on every push/PR to `main`.

### 2. Why it was needed

Every later phase depends on this being solid and boring: package
boundaries, type strictness, and CI enforcement all have to exist _before_
`domain`/`plugin-api`/`application` land in Phase 2, or those packages get
built against a moving foundation. Getting the tooling right once now — a
real pre-commit hook, a real CI pipeline, a real Changesets setup — means
Phase 2 onward is just adding packages into a shape that already works,
rather than retrofitting process onto code later.

### 3. Commands to verify it

Run from the repository root:

```bash
pnpm install        # installs the workspace; should complete with no errors
pnpm format:check   # Prettier — should report all files conform
pnpm lint           # ESLint — should report zero errors
pnpm build          # see "what to expect" below — succeeds, does no work yet
pnpm test           # see "what to expect" below — succeeds, does no work yet
```

### 4. What to expect

- `pnpm install` resolves and links dependencies (currently ~360 packages,
  all dev tooling — no runtime dependencies exist yet because no product
  code exists yet).
- `pnpm format:check` and `pnpm lint` both pass cleanly — there is very
  little to check yet, but the gates are real and will fail on a genuine
  violation (try it: break formatting in `eslint.config.js` and re-run).
- `pnpm build` prints `No projects matched the filters` and exits `0`.
  This is expected and correct, not a stub: the root `build` script
  delegates to each package's own `build` script in dependency order, and
  there are no packages yet. Once Phase 2 adds `domain`, this same command
  will actually compile it.
- `pnpm test` prints `No test files found, exiting with code 0`. Same
  situation — the runner is fully configured, there is simply nothing to
  test yet.
- Nothing runs against a real Cardano tool, node, or network at this
  phase — there is no Aiken invocation, no chain access, nothing
  blockchain-specific at all yet. That is intentional and starts in a
  later phase.

### 5. What does not exist yet

- No packages under `packages/` or `examples/` — the directories
  referenced by `pnpm-workspace.yaml` don't exist on disk yet.
- No domain types, no ports, no use cases, no plugin system, no CLI.
- No Aiken, Lucid Evolution, or chain-provider integration of any kind.
- No published npm packages, no version tags, no changelog entries.

### 6. Next phase

**Phase 2** implements exactly five packages — `domain`, `plugin-api`,
`application`, `plugin-loader`, `platform-sdk` — with real domain types,
typed ports, the plugin registry and hook system, dependency injection
between them, and full unit test coverage. No Cardano-specific adapters
(Aiken, Lucid Evolution, chain providers) are implemented in Phase 2; that
begins only after this phase is reviewed and approved.

---

## Phase 2 — Domain, Plugin API, Application, Plugin Loader, Platform SDK

**Status: complete, awaiting approval before Phase 3.**

Scope was expanded mid-phase, with your explicit approval, to fold in the
AI-native pivot's core surface: a strict intent → deterministic-template
generation pipeline (never letting a language model write Aiken source)
and a first-class `Explain` capability. This is reflected below and in the
updated `Architecture.md`.

### 1. What was built

- **`domain`**: pure entities and value types — `Project`, `Network`,
  `Blueprint` (a CIP-57-shaped model), `DeploymentManifest`,
  `TestResult`/`TestReport`, `Wallet`/`Utxo`, `ContractIntent`,
  `ContractTemplate`, `ContractParameters`, `GeneratedContract`,
  `Rationale`, `Explanation`, `ReviewReport`, `DocumentationArtifact`,
  `ResolvedForgeConfig`. Three of these (`createContractIntent`,
  `createRationale`, `summarizeTestResults`) carry real validation/
  aggregation logic, not just shape — zero runtime dependencies.
- **`plugin-api`**: the extensibility contract — `ForgePlugin`,
  `PluginContext`, `PortToken`/`createPortToken` (a typed DI-token
  pattern), the `HookEvent`/`HookPayloadMap`/`HookHandler` system, and
  `CommandDefinition`/`GeneratorDefinition`.
- **`application`**: ten typed ports (`IAikenCompilerPort`,
  `ISdkGeneratorPort`, `IEmulatorPort`, `IChainProviderPort`,
  `ITxBuilderPort`, `IDeploymentStorePort`, `IDevnetPort`,
  `IFileSystemPort`, `ILanguageModelPort`, `IContractTemplateEnginePort`),
  the `PlatformRegistry` (port bindings + hook bus + command/generator
  registry), and twelve use cases — the five original lifecycle ones
  (`ScaffoldProject`, `Compile`, `GenerateSdk`, `RunTests`, `Deploy`) plus
  the AI-native set (`SelectTemplate`, `GenerateContract`,
  `ReviewContract`, `Explain`, `GenerateDocs`, `GenerateSecurityTests`)
  and the `BuildFromDescription` orchestrator that composes all of them
  into the `forge create` pipeline.
- **`plugin-loader`**: dependency-ordered plugin loading
  (`topologicallySortPlugins`, with cycle and missing-dependency
  detection), a per-plugin-scoped `PluginContext` factory, and
  `loadPlugins`, which fails fast if a caller-specified required port was
  never bound.
- **`platform-sdk`** (`@forge/sdk`): the `Forge` facade class — the one
  package a presentation layer depends on. `Forge.create()` boots plugins
  into a registry; every other method resolves the ports it needs from
  that registry and delegates to an `application` use case. It re-exports
  `domain`, `plugin-api`, and `application` so a plugin author only ever
  needs this one dependency.

### 2. Why it was needed

This is the platform's entire non-Cardano-specific core: every later
adapter (Aiken, Lucid Evolution, the AI backend, the contract template
library) is just a plugin that implements one of the ten ports declared
here and binds it through the identical mechanism. Building this layer
correctly first — and proving it works with fakes, before any real
external tool is involved — is what makes the "plugin system isn't
decorative" claim in the architecture docs true rather than aspirational.
The strict separation inside `GenerateContractUseCase` (the language model
is called exactly twice, for intent and for parameters, and never sees a
prompt asking it to write Aiken) is enforced at this layer specifically so
no future adapter can quietly reintroduce freehand code generation.

### 3. Commands to verify it

```bash
pnpm install
pnpm format:check
pnpm lint
pnpm build
pnpm test
```

### 4. What to expect

- All five commands succeed.
- `pnpm build` now actually compiles five packages via TypeScript project
  references, in dependency order (`domain` → `plugin-api` → `application`
  → `plugin-loader` → `platform-sdk`).
- `pnpm test` builds first, then runs Vitest: **21 test files, 53 tests,
  all passing** — no Cardano tool, network call, or LLM API is touched by
  any of them; every port is a hand-written fake.
- Still no Aiken invocation, no real chain access, no real language model
  call anywhere in the codebase — every "AI" and "blockchain" behavior
  exercised so far is a test double standing in for a port. That is
  correct for this phase, not a shortcut.

### 5. What does not exist yet

- No `adapter-aiken`, `adapter-lucid`, `adapter-ai`, `adapter-storage`,
  `adapter-providers`, `contract-templates`, or `ai-testgen` — none of the
  ten ports has a real implementation yet, only the fakes in tests.
- No CLI (`packages/cli` doesn't exist) — nothing in Phase 2 is invokable
  from a terminal; it is exercised entirely through unit tests calling
  `Forge` and the use cases directly.
- No `examples/escrow` or `examples/vesting` fixture project yet.
- No real Aiken compilation, no CIP-57 parsing of an actual blueprint, no
  real transaction building, no real deployment to any network.

### 6. Next phase

**Phase 3** is expected to implement the first real adapters —
most likely `adapter-aiken` (real `aiken build`/`aiken check` plus real
CIP-57 parsing) and `contract-templates` (the Forge Engine plus the first
audited template, escrow-with-milestones) — so that `forge create` can run
against something real for the first time. This file will be updated
again once that scope is agreed and completed; Phase 3 does not begin
until Phase 2 is explicitly approved.

---

## Phase 3 — Real Aiken compilation, templates, codegen, and emulator

**Status: complete, awaiting approval before Phase 4.**

Scope: the four packages you named (`adapter-aiken`, `contract-templates`,
`adapter-codegen-ts`, `adapter-emulator`), plus one small addition
(`adapter-filesystem`) discovered as a genuine gap during integration — no
CLI, as instructed.

### 1. What was built

- **Domain correction (discovered, not assumed).** Before writing any
  adapter code, the real Aiken compiler (`@aiken-lang/aiken` v1.1.23) was
  installed and used to compile a real validator. Its actual CIP-57
  output didn't match Phase 2's guessed `Blueprint` shape (redeemer/datum
  are `{ title?, schema }` wrappers, not bare schemas; schemas use
  `$ref`/`anyOf`/`index`; there's a flat `definitions` dictionary). The
  domain `Blueprint` type was corrected to match reality, plus a new
  `resolveSchemaRef` helper — a deliberate, verified fix, not a guess.
  Every Phase 2 test fixture using the old shape was updated to match.
- **`adapter-aiken`**: real integration with the actual Aiken compiler —
  resolves its binary via the `@aiken-lang/aiken` npm package (no PATH
  dependency), runs `aiken build`/`aiken check` as child processes, writes
  a real `aiken.toml`, and parses real CIP-57 JSON and real `aiken check`
  JSON test reports into domain types. `IAikenCompilerPort` gained an
  `ensureProject` method (idempotent scaffolding) that `CompileUseCase`
  now calls before building.
- **`contract-templates`** (the Forge Engine): one audited template,
  escrow-with-milestones, verified by hand against the real compiler
  before being committed as a template. Rendering is plain string
  substitution — `milestoneCount` is the only template parameter (a
  compile-time constant); `beneficiary` is deliberately _not_ a template
  parameter — it's a datum field the generated SDK types, filled in later
  through the typed SDK, per ADR-004.
- **`adapter-codegen-ts`**: generates real TypeScript from a real
  blueprint — a named `interface`/tagged-union `type` per Aiken `pub type`
  (resolving `$ref`/`anyOf` recursively), plus a typed Datum/Redeemer
  alias and a metadata constant per validator.
- **`adapter-emulator`**: a real (not mocked) in-memory UTxO ledger.
  Scope is intentionally limited — no transaction-building or Plutus
  execution engine exists yet, so a scenario passes when the ledger has a
  genuinely seeded, spendable UTxO to exercise it against. This is an
  honest, generic check, not a simulation of any specific validator's
  redeemer logic.
- **`adapter-filesystem`** (addition beyond the four named packages): a
  real `IFileSystemPort` backed by `node:fs/promises`. Without it,
  `ScaffoldProjectUseCase` had nothing to write to disk with — no package
  in the original four owned this generic a concern, so this one is
  intentionally minimal (two files).
- **End-to-end proof**: a real integration test (`forge.integration.test.ts`)
  wires `Forge` with all five real adapters above plus a small
  hand-written fake standing in for the not-yet-built `adapter-ai`, and
  drives `scaffoldProject → generateContract → compile → generateSdk →
runTests` — producing a real compiled blueprint, a real generated SDK
  file, and a real test report, against the actual Aiken compiler.

### 2. Why it was needed

Phase 2 proved the architecture with fakes; Phase 3 proves it against
reality. The domain `Blueprint` correction specifically matters because
Phase 2's guess, while reasonable, would have produced a codegen adapter
built on a fictional interface — finding this now, before more code
depends on it, is exactly why the port boundary exists (one package
changed shape; the use cases and facade that depend on the _port_, not
the shape's specifics, needed no logic changes). `adapter-filesystem`
matters because "produce a real project end-to-end" is not actually true
until something writes real bytes to a real disk.

### 3. Commands to verify it

```bash
pnpm install
pnpm format:check
pnpm lint
pnpm build
pnpm test               # fast suite — no network, no real Aiken binary
pnpm test:integration   # slow suite — real Aiken compiler + real network
```

### 4. What to expect

- `pnpm test` completes in ~2 seconds, 92 tests, fully offline — none of
  the new adapters' fast tests touch the network or the real binary; they
  use realistic fixtures captured verbatim from real compiler output.
- `pnpm test:integration` takes roughly 20 seconds and requires network
  access (to fetch the Aiken standard library the first time) — it
  really shells out to the Aiken compiler, really parses its output, and
  really writes a generated SDK file to a temp directory. All 4
  integration tests pass.
- No CLI exists — everything above is exercised by calling `Forge`'s
  methods directly, exactly as instructed.

### 5. What does not exist yet

- `adapter-ai` — the real `ILanguageModelPort` implementation. The
  integration test uses a small hand-written fake in its place, clearly
  labeled as not a real adapter.
- `ai-testgen` — the deterministic security-test generator; no plugin
  currently registers a generator, so `GenerateSecurityTestsUseCase`
  correctly (and honestly) returns an empty, passing report.
- Any transaction-building or Plutus execution — `adapter-emulator`
  cannot yet evaluate whether a specific redeemer/datum combination would
  actually satisfy the compiled validator logic.
- `adapter-storage`, `adapter-providers`, `adapter-devnet` — deployment
  and multi-provider chain access remain unimplemented.
- A second contract template — only escrow-with-milestones exists.
- Still no CLI.

### 6. Next phase

Not yet scoped — awaiting direction. Plausible candidates based on the
gaps above: `adapter-ai` (a real, locally-runnable language model
backend, per ADR-003's constraints), `ai-testgen` (the security rule
engine, now that a real blueprint exists to analyze), or the CLI itself.

---

## Phase 4 — adapter-ai, adapter-providers, and the `forge` CLI

**Status: complete, awaiting approval before Phase 5.**

Scope: exactly the six priorities you gave, in order, plus one necessary
addition (`adapter-providers`) discovered while wiring the CLI's
deployment step — without it, "deployment artifacts" in the live demo
would have had nothing real to show.

### 1. What was built

- **`adapter-ai`** — the real `ILanguageModelPort` implementation. Per
  ADR-003, its only two responsibilities are structured extraction and
  narration; it never writes Aiken source. Deliberately **local and
  dependency-free** (no hosted API, no network, no API key) — a
  reliability decision, not a capability shortcut: a live demo should
  never be able to fail because of a network blip or a rate limit for a
  task (classifying among a small set of known templates, pulling a
  number out of a sentence) that a transparent heuristic handles
  reliably. Three pieces: `classifyIntent` (keyword-coverage scoring
  against known template categories), `extractParameters` (finds numbers
  in free text, digit or spelled-out, and only ever sets a value when one
  was actually found — never guessed), and `narrate` (turns recorded
  `Rationale` facts into prose).
- **`adapter-providers`** (addition): `ChainProviderAdapter` computes a
  **real CIP-19 bech32 Cardano address** from a validator's script hash —
  correct address-type nibble and network tag, verified by a round-trip
  encode/decode test, not just "looks like an address." `LocalDeploymentStore`
  writes a real, versioned JSON deployment manifest under
  `<project>/deployments/<network>/`. `NotImplementedTxBuilder` is an
  honest stub — the escrow-milestone template needs no setup transaction,
  so it's never actually invoked, and it fails loudly rather than
  pretending to submit anything if it ever is.
- **`packages/cli`**: the first real presentation layer. `forge build
"<description>"` wires every real adapter (filesystem, Aiken, templates,
  codegen, emulator, providers, AI) into a `Forge` instance and calls
  `buildFromDescription`. A small `forge-cli-progress-narrator` plugin
  narrates progress purely by listening to hooks the platform already
  fires (`onProjectInit`, `beforeCompile`/`afterCompile`, `beforeTest`/
  `afterTest`, `beforeDeploy`/`afterDeploy`) — no new hook types were
  added for this. The command also writes the previously-generated-but-
  never-persisted `GenerateDocsUseCase` output to disk (a real gap from
  Phase 2, closed here) and calls `forge.explain(...)` on the template
  rationale to show that capability live in the summary output.

### 2. Why it was needed

This phase's job was the hackathon experience, not more architecture — so
the design bar was different: every choice was screened against "does
this make the live demo more reliable" rather than "is this the most
capable version." That's why `adapter-ai` is local instead of
API-backed, and why `forge build`'s output is deliberately narrated
(judges see _why_ something is happening, not just a wall of text at the
end).

### 3. Commands to verify it

```bash
pnpm install
pnpm format:check
pnpm lint
pnpm build
pnpm test               # fast suite — 128 tests, offline, ~4s
pnpm test:integration    # real Aiken + real network — 5 tests, ~40s
```

Or, to see exactly what a judge would see:

```bash
node packages/cli/dist/bin.js build "Build an escrow smart contract with milestone-based payments"
```

### 4. What to expect

`forge build` prints live progress (scaffold → compile → SDK → tests →
deploy), then a summary. Verified in this session, from a clean temp
directory:

- A real `aiken.toml` and a real, compiling `validators/escrow_milestone.ak`.
- A real compiled CIP-57 blueprint (`plutus.json`).
- A real generated TypeScript SDK (`sdk/generated/index.ts`) with a typed
  `EscrowDatum` interface and `EscrowRedeemer` tagged union.
- A real emulator test result (1 passed, 0 failed).
- A real, valid bech32 testnet address (`addr_test1...`) and a versioned
  deployment manifest JSON.
- A "Why this template" explanation, grounded in the actual recorded
  `Rationale`, not invented after the fact.

All five outputs you asked to see in the live demo are real, not staged.

### 5. What does not exist yet

- `ai-testgen` — still no registered security-test generator;
  `GenerateSecurityTestsUseCase` still correctly returns an empty report.
- Any transaction-building or Plutus execution — `adapter-emulator`'s
  scope is unchanged from Phase 3.
- A second contract template.
- `adapter-storage` (as a distinct concern from `adapter-providers`),
  `adapter-devnet`.
- Docker packaging, a recorded/scripted demo video, CI wiring for
  `pnpm test:integration` (it currently only runs locally, on demand).

### 6. Next phase

Not yet scoped — awaiting direction after the live demo.

---

## Hackathon Polish Phase — demo readiness, docs, GitHub readiness, code quality, judge prep

**Status: complete.**

Scope: no new features (explicitly instructed) — reliability, honesty,
and presentation of what already existed.

### 1. What was built

- **Demo readiness**: polished CLI output (fixed the actual execution
  order the narration implied vs. what really runs first; fixed a real
  doubled-period bug in the "why" explanation; quieted routine plugin-load
  log noise; made the printed SDK path relative instead of a long
  absolute path). Verified the entire pipeline from a **fully clean
  workspace** — every `node_modules`, every package's `dist/`, and all
  `.tsbuildinfo` files were deleted, then `pnpm install --frozen-lockfile
&& pnpm build && pnpm test && pnpm test:integration` all passed, and
  `forge build` was re-run from a fresh scratch directory afterward.
- **Code quality audit**: systematic grep-based sweep for TODO/FIXME
  markers (none found), explicit `any` (none found), stray `console.*`
  outside `cli` (none found), `eslint-disable` suppressions (none found),
  unsafe double-casts (one found and removed, in `adapter-ai`), and
  missing per-package documentation (all 13 packages were missing a
  `README.md` — written for every one of them).
- **Documentation**: a new root `README.md` (the GitHub landing page —
  problem statement, why Forge, feature matrix, architecture diagram,
  quick start, a real captured demo transcript, project layout, roadmap,
  docs index, contributing pointer). Reviewed and corrected staleness in
  `Vision.md`, `PRD.md`, `Architecture.md`, `CompetitiveAnalysis.md`, and
  `BusinessCase.md` — several had drifted during the AI-native pivot and
  still referenced a `forge create` command and an already-delivered
  `ai-testgen`/security-test-generator that were never actually built
  that way; corrected to describe `forge build` and to honestly label
  `ai-testgen` as architected-for-but-not-implemented everywhere it came
  up. Rewrote `DemoPlan.md` entirely around the real, verified CLI
  command and output — every command in it was re-run and its output
  reconfirmed during this pass, including a second scripted run with an
  explicit parameter count to prove extraction (not just defaulting)
  works.
- **GitHub readiness**: `LICENSE` (Apache-2.0), `CONTRIBUTING.md`
  (project-specific: review bar by package, how to add an adapter, how to
  add a template), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1),
  `SECURITY.md` (honest about audit status and known limitations, not
  boilerplate), `CHANGELOG.md` (Keep a Changelog format, phase-by-phase),
  `.github/ISSUE_TEMPLATE/` (bug report + feature request, YAML forms),
  `.github/PULL_REQUEST_TEMPLATE.md`, and `docs/ReleaseProcess.md`
  (labels, semver policy, Changesets-based release strategy).
- **Production Readiness Review** (`docs/ProductionReadiness.md`):
  strengths, weaknesses, accepted technical debt (in a table, with the
  reasoning for accepting each item), security considerations,
  scalability considerations.
- **Judge preparation** (`docs/JudgePreparation.md`): 30-second, 2-minute,
  and 5-minute pitches, plus a 27-question FAQ grounded in the actual
  codebase (every technical claim in it is verifiable by reading a named
  file).
- **Final Engineering Report** (`docs/FinalEngineeringReport.md`):
  architecture summary, folder structure, dependency graph, a full
  feature matrix (delivered vs. not, with test coverage per row), test
  summary, known limitations, and a prioritized, reasoned v1.1 roadmap.

### 2. Why it was needed

A technically complete platform and a _legible_ one are different things.
Several docs had genuinely drifted from reality during the AI-native
pivot and the four build phases that followed — not dishonestly, just
because "update every doc every time" wasn't the working discipline
during rapid iteration. This phase was the deliberate pass to close that
gap: every claim left standing after this phase was re-verified against
the actual code or a fresh command run, not assumed to still be true from
when it was written.

### 3. Commands to verify it

Identical to Phase 4 — nothing about the verification surface changed,
only its accuracy:

```bash
pnpm install
pnpm format:check
pnpm lint
pnpm build
pnpm test
pnpm test:integration
node packages/cli/dist/bin.js build "Build an escrow smart contract with milestone-based payments"
```

### 4. What to expect

All of the above pass, identically to Phase 4, now re-verified from a
fully clean workspace rather than an incrementally-built one. The `forge
build` output is visibly cleaner: correct execution-order narration, no
doubled punctuation, no routine log noise, relative paths in the summary.

### 5. What does not exist yet

Unchanged from Phase 4 — this phase added no features, per instruction:
`ai-testgen`, real transaction building/Plutus execution, a second
contract template, `adapter-devnet`, Docker packaging, CI wiring for
`pnpm test:integration`.

### 6. Next phase

Confidence-gated template matching (below), prompted by a direct question
during judge-prep rehearsal: "what happens if the description doesn't
match any template?" The honest answer at the time — "it silently
generates the escrow template anyway, just at a visibly low confidence
number" — was not good enough for a tool whose entire trust argument is
deterministic, auditable generation.

---

## Confidence-Gated Template Matching

**Status: complete.**

Scope: one behavior change, hardening the one failure mode Phase 4 left
unresolved — no new packages, no new ports, no new templates.

### 1. What was built

- `SelectTemplateUseCase` now rejects with `LowConfidenceTemplateMatchError`
  (naming the detected confidence, the required threshold, and every
  currently supported template) instead of silently falling back to the
  first registered template when nothing matches confidently enough. See
  [ADR-006](adr/ADR-006-confidence-gated-template-matching.md).
- `BuildFromDescriptionUseCase` now runs template selection **before**
  scaffolding — a rejected description creates no project directory, no
  file, nothing. Rejection is a true no-op, not a partial failure cleaned
  up after the fact.
- `forge build`'s new `--min-confidence <0-1>` flag (default 0.6, matching
  `SelectTemplateUseCase`'s default) makes the threshold configurable
  without a code change.
- 10 new tests: unit coverage for the rejection path and the custom
  threshold at every layer it passes through (`select-template`,
  `generate-contract`, `build-from-description`, `parse-build-args`), plus
  a real end-to-end integration test proving a mismatched description is
  rejected by the actual compiled CLI and creates nothing on disk.

### 2. Why it was needed

The previous fallback (`classifyIntent` always resolves to _some_
category, even at low confidence) meant an unrelated request — "a token
vending machine that mints NFTs" — still silently produced a compiled,
tested, deployment-ready _escrow_ project. That's a worse failure mode
than an error: it looks successful. A tool whose central pitch is "every
generated contract traces back to an audited template and a validated
parameter set" cannot also silently generate the wrong template.

### 3. Commands to verify it

```bash
pnpm build && pnpm test && pnpm test:integration
node packages/cli/dist/bin.js build "I want to build a decentralized voting system for governance proposals"
# exits 1, prints the detected confidence, threshold, and supported
# template list — creates no directory
```

### 4. What to expect

138 unit tests (up from 128), 6 integration tests (up from 5), all
passing. The rejection case above prints a clear error and exits non-zero;
nothing is written to disk. A matching description (confidence ≥ 0.6)
succeeds exactly as before — this change only narrows the failure path, it
does not touch the success path.

### 5. What does not exist yet

Unchanged from the Polish Phase: `ai-testgen`, real transaction
building/Plutus execution, a second contract template, `adapter-devnet`,
Docker packaging, CI wiring for `pnpm test:integration`. With only one
template registered, this gate is currently equivalent to "was the
classifier itself confident" — it becomes more discriminating once a
second template exists for a description to be confidently routed to one
over the other.

### 6. Next phase

Growing the template library past one entry — a direct request ahead of
the hackathon demo, to prove the platform's "select the right template
from natural language" claim actually holds across more than one option.

---

## NFT Minting and Token Vesting Templates

**Status: complete.**

Scope: two new contract templates, fully wired end to end — no changes to
the pipeline's shape, only its content.

### 1. What was built

- **`nft-minting-royalty`** — a real Aiken `mint` validator. Checks that
  exactly one unit of a named asset is minted under the policy, and that
  a royalty payment (a compile-time percentage of a compile-time mint
  price) is paid to a compile-time royalty beneficiary hash. Verified
  against the real Aiken compiler (`use cardano/assets`, `cardano/address`).
- **`token-vesting`** — a real Aiken `spend` validator. Locks funds for a
  beneficiary (set via datum, same pattern as `escrow-milestone`),
  released across a configurable number of equal tranches gated by the
  transaction's validity range (`aiken/interval.is_entirely_after`), not
  just a signature.
- Both templates registered in `ContractTemplateEngineAdapter`, with new
  intent-classifier keyword categories (`nft-minting-royalty`,
  `token-vesting`) so `classifyIntent` and `SelectTemplateUseCase`
  correctly disambiguate among all three templates — verified by unit
  tests that would fail if classification confused any two of them.
- 10 new tests: template rendering (defaults + overrides) for both
  templates, engine-adapter registration, classifier disambiguation
  across all three categories, `SelectTemplateUseCase` three-way
  disambiguation, and — critically — two real end-to-end integration
  tests that compile both new templates with the actual Aiken compiler
  through the actual CLI, proving the number extracted from each
  description (not the template's own default) ends up in the compiled
  source.
- Root `README.md` gained a "Multiple templates, correctly disambiguated"
  section with a real, captured second transcript; `docs/DemoPlan.md`'s
  depth-pass beat 5 now proves template diversity instead of re-running
  the same template with a different parameter.

### 2. Why it was needed

One audited template proved the pipeline; it didn't prove the pipeline
_generalizes_. Ahead of the hackathon demo, the explicit ask was to
strengthen exactly that claim — show that `forge build` genuinely
classifies among real alternatives and routes to the right one, not that
it always produces the same escrow contract regardless of what's asked.
Choosing an NFT mint (a `mint` validator, exercising a code path the
platform had never compiled before) and a vesting schedule (a `spend`
validator gated by time instead of signature) deliberately covers two
validator shapes escrow-milestone doesn't.

### 3. Commands to verify it

```bash
pnpm build && pnpm test && pnpm test:integration
node packages/cli/dist/bin.js build "Mint an NFT collection with an 8% royalty on every sale"
node packages/cli/dist/bin.js build "Create a token vesting contract with a 6-period unlock schedule"
```

### 4. What to expect

148 unit tests (up from 138), 8 integration tests (up from 6), all
passing. Both commands above produce a real compiled Aiken project, a
real CIP-57 blueprint, a real typed SDK, a passing test, and a real
deployment address — identically to the escrow flow, just routed to a
different template with the "why this template" / "why these parameters"
output naming exactly which one and why.

### 5. What does not exist yet

Unchanged otherwise: `ai-testgen`, real transaction building/Plutus
execution, `adapter-devnet`, Docker packaging, CI wiring for
`pnpm test:integration`. All three templates still have exactly one
extractable numeric parameter each (a real, documented constraint of
`adapter-ai`'s extractor, not something these two templates worked
around) — every other parameter uses a declared default. Keyword-coverage
classification is still untested against categories with genuinely
overlapping vocabulary, since all three current categories happen to use
distinct terms.

### 6. Next phase

Presentation polish on the template library itself — the raw category
names (`escrow-milestone`, `nft-minting-royalty`) were readable in code
but not judge-friendly on screen.

---

## Template Presentation Polish

**Status: complete.**

Scope: cosmetic and informational only — no behavior change to
classification, extraction, rendering, or compilation.

### 1. What was built

- Added an optional `useCases?: readonly string[]` field to the domain
  `ContractTemplate` type, populated for all three templates (e.g. escrow:
  `["Freelancing", "Construction", "Project funding"]`).
- Shortened each template's display `name` to a cleaner title ("Escrow
  with Milestone Payments", "NFT Minting with Royalties", "Token
  Vesting") — cosmetic only; `id` and `category` values (what
  classification and rendering actually key off) are unchanged.
- `LowConfidenceTemplateMatchError`'s message now renders a numbered
  "Supported Smart Contract Templates" list with each template's use
  cases as bullets, instead of a flat one-line-per-template list.
- Root `README.md` gained a "Traditional development vs. Forge" table in
  the "Why Forge?" section, and its demo transcripts were re-captured
  live to reflect the renamed templates and the new rejection-error
  format.
- 2 new tests covering the use-cases formatting (present and absent
  cases) in `LowConfidenceTemplateMatchError`.

### 2. Why it was needed

The raw category identifiers were fine for `--min-confidence` error
messages read by a developer, but not for what a judge sees on a demo
screen — "escrow-milestone" doesn't communicate what the contract is for
the way "Escrow with Milestone Payments / Freelancing, Construction,
Project funding" does.

### 3. Commands to verify it

```bash
pnpm test && pnpm test:integration
node packages/cli/dist/bin.js build "I want to build a decentralized voting system for governance proposals"
# prints the numbered, use-case-annotated template list and exits 1
```

### 4. What to expect

150 unit tests (up from 148), 8 integration tests (unchanged — no new
integration scenarios, only a display change). All prior "why this
template" narration still matches (`intent category "..." exactly
matches template category "..."` still names the unchanged `category`
values), just with the friendlier `name` printed alongside it.

### 5. What does not exist yet

Unchanged: `ai-testgen`, real transaction building/Plutus execution,
`adapter-devnet`, Docker packaging, CI wiring for `pnpm test:integration`,
a fourth contract template.

### 6. Next phase

Not yet scoped. See `docs/FinalEngineeringReport.md`'s "Suggested v1.1
roadmap" for the prioritized candidate list.
