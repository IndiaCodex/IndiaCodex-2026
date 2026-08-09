# Production Readiness Review

An honest engineering assessment of Forge as it stands at the end of the
hackathon submission window. This document is written to be read by
someone deciding whether to build on, fund, or extend this project — it
is not a sales pitch. Where something is genuinely good, it says so
plainly; where something is a real gap, it says that plainly too.

## Strengths

**Every claim in the demo is backed by a real integration test, not a
mock.** `pnpm test:integration` shells out to the actual Aiken compiler,
fetches the actual `aiken-lang/stdlib` from GitHub, computes a real
bech32 Cardano address, and writes real files to disk. This was a
deliberate discipline maintained across all four build phases — when
Phase 3 discovered the real CIP-57 output didn't match an earlier
assumption, the domain model was corrected rather than the assumption
being quietly kept.

**The architecture holds up under its own scrutiny.** Clean Architecture
boundaries (domain → application → adapters → frameworks) are enforced
by the actual package dependency graph, not just described in a document.
Ten ports, twelve use cases, and every adapter follow the same
constructor-injection pattern with zero global state. The plugin system
is dogfooded — built-in adapters register through the identical
`ForgePlugin`/`PluginContext` API a third party would use, which is
verified directly by tests, not just asserted in prose.

**The one non-negotiable design rule is actually enforced in code, not
just claimed in docs.** The language model (`adapter-ai`) has exactly two
methods (`extractStructured`, `narrate`) and no code path from either one
to a file write — `GenerateContractUseCase` calls the deterministic
Forge Engine, never the language model, to produce Aiken source. A
reviewer can verify this by reading `packages/adapter-ai/src/` in full in
a few minutes.

**Test coverage is real and reasonably comprehensive for what exists.**
150 fast unit tests (offline, seconds) plus 8 integration tests (real
tools, under a minute) as of this writing. Fixtures for the Aiken
compiler's JSON output were captured verbatim from real runs, not
hand-guessed.

**Documentation is unusually thorough for a hackathon submission** — six
ADRs recording actual trade-off decisions (not after-the-fact
justification), a phase-by-phase build log that hasn't been retroactively
cleaned up, and per-package READMEs.

## Weaknesses

**The single largest gap is `ai-testgen`.** The platform's core pitch
included an automated eUTxO-specific vulnerability rule engine (double
satisfaction, missing signer checks, etc.). The generator port and
`Rationale`-carrying pipeline for it exist and are wired end to end, but
no rule engine has been written — `GenerateSecurityTestsUseCase` honestly
returns an empty report today. This is disclosed everywhere it's
relevant (README, PRD, CompetitiveAnalysis, SECURITY.md), but it means
the platform does not yet deliver on its most differentiated claim versus
other ecosystem tooling.

**`adapter-emulator` cannot evaluate actual contract logic.** It checks
whether a seeded wallet has a spendable UTxO — a real, generic ledger
check — but there is no transaction-building pipeline or Plutus/UPLC
execution engine behind it. A passing `forge build` test today verifies
the pipeline runs end to end, not that the generated validator's redeemer
logic is behaviorally correct under adversarial input.

**Three contract templates exist** (escrow with milestones, NFT minting
with royalty support, token vesting with a linear unlock schedule), each
verified against the real Aiken compiler. Adding the second and third
required no change to `render.ts`, the template engine adapter's public
shape, or any layer above it — only a new template file, a registry entry,
and new intent-classifier keywords (see
[ADR-004](adr/ADR-004-template-engine.md)) — which is real evidence the
template-authoring process scales, not just an architectural promise.
Three is still a small library relative to real-world Cardano use cases;
growing it further is now accepted as a content-authoring effort, not an
open architectural question.

**`ITxBuilderPort`'s only implementation is a stub that rejects.** This
is honestly labeled, never silently invoked by the shipped template, and
covered by a test — but it means no real off-chain transaction can
actually be built or submitted by this platform today. "Deployment" means
computing a real address and writing a real manifest, not broadcasting a
transaction to a live network.

**No third-party security audit.** See `SECURITY.md`. The one template
has been manually reviewed by the project's own contributors, which is
categorically different from an independent audit.

**Test coverage has a known blind spot: `adapter-emulator`'s limitation
means "the test suite is green" cannot be read as "the generated contract
is safe."** This is the most important nuance for anyone evaluating this
project to internalize, and it's why it's stated here twice.

## Technical debt (accepted, not hidden)

| Item                                                                | Why it's accepted                                                                                                                                                                                              |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createSilentLogger()` test helper duplicated across ~10 test files | Each package's tests stay independently readable and self-contained; a shared test-utils package would add a workspace dependency to save a 3-line function. Revisit if the duplication grows materially.      |
| `IDevnetPort` declared with zero implementations                    | Deliberate roadmap surface — the port shape is stable for whoever implements `adapter-devnet` later, costs nothing to leave declared.                                                                          |
| Aiken's `Int` maps to TypeScript `number`, not `bigint`             | Plutus integers are arbitrary-precision; `number` is not. Reasonable simplification until a template needs values large enough for it to matter — see `adapter-codegen-ts`'s README.                           |
| Test files compile into each package's `dist/` alongside source     | No package is published yet; splitting this cleanly needs a second tsconfig per package purely for this. Low priority until publishing is imminent.                                                            |
| `pnpm test:integration` is not wired into CI                        | It needs real network access (to fetch Aiken's stdlib) and takes materially longer than the fast suite; CI currently runs the fast suite only. Should be added as a separate, non-blocking CI job before v1.0. |

## Security considerations

- **No secrets are logged.** Reviewed across every adapter; none exists
  that would have a secret to log in the first place (no private keys are
  handled anywhere in this codebase yet — there is no real transaction
  signing).
- **The deterministic-generation guarantee is the project's main security
  argument**, not a generic "we tested it" claim: every deployed
  validator's source traces back to an audited template plus a validated
  parameter set, never freehand model output. This is real and verifiable
  by reading `packages/contract-templates/` and
  `packages/adapter-ai/` directly.
- **A low-confidence template match is refused, not guessed.**
  `SelectTemplateUseCase` rejects with `LowConfidenceTemplateMatchError`
  (naming the detected confidence, the required threshold, and every
  supported template) when nothing matches the description confidently
  enough — checked before any file is written, so a rejected description
  scaffolds nothing. The threshold defaults to 0.6 and is configurable via
  `--min-confidence`.
- **The generated escrow template has not been through a formal audit.**
  Do not use it to hold real value on mainnet without independent review
  — stated plainly in `SECURITY.md` and worth restating here.
- **CIP-19 address computation is verified by round-trip testing**
  (encode then decode, compare bytes) but has not been cross-checked
  against an independent second implementation or a published official
  test vector set. Low risk (the algorithm is simple and the test is
  meaningful) but worth noting precisely rather than glossing over.

## Scalability considerations

This is a developer-tooling CLI, not a service — "scalability" here means
"does the tool stay fast and correct as projects and templates grow,"
not request throughput.

- **Template count**: nothing architecturally limits the template
  library, and this is no longer just a theoretical claim —
  `IContractTemplateEnginePort.listTemplates()` now returns three
  templates (escrow, NFT minting royalty, token vesting), each with its
  own intent-classifier keywords, and `classifyIntent`/`SelectTemplateUseCase`
  correctly disambiguate among all three (see the intent-classifier and
  select-template test suites). Intent classification's keyword-coverage
  scoring is still simple and would need revisiting (or a real,
  still-local NLP approach) once template categories start overlapping
  semantically in their keyword vocabulary — untested territory at three
  templates with clearly distinct vocabularies, worth watching as the
  library grows further.
- **Monorepo build time**: TypeScript project references give correct
  incremental builds; the fast test suite completing in ~2-4 seconds with
  13 packages suggests headroom before this becomes a real constraint.
- **Plugin loading**: topological sort is O(V+E) over the plugin
  dependency graph — a non-issue at any realistic plugin count for a CLI
  tool.
- **The real constraint is the Aiken compiler itself** (compilation and
  stdlib-fetch time), which is entirely outside this project's control
  and already the dominant cost in every timing measurement taken during
  development (~5-6 seconds per real `aiken build` call, dominating the
  ~10-11 second end-to-end `forge build` run).

## Future roadmap

See [`docs/FinalEngineeringReport.md`](FinalEngineeringReport.md) for the
prioritized v1.1 roadmap. In one sentence: `ai-testgen` first (it closes
the largest gap between the pitch and the delivered platform), a real
transaction-building pipeline second (it's the prerequisite for
`adapter-emulator` to mean something stronger), then breadth (more
templates, more chain providers, more presentation layers).
