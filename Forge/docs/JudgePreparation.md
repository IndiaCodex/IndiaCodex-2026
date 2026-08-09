# Judge Preparation

Pitches at three lengths, plus an FAQ built from the questions most
likely to come up — grounded in what's actually built and tested, not
aspirational.

## 30-second elevator pitch

> Forge is an AI-native developer platform for Cardano. You describe a
> smart contract in plain English, and Forge gives you back a real,
> compiled Aiken project, a typed TypeScript SDK, passing tests, and a
> deployment artifact — in about ten seconds. The one rule that makes
> this trustworthy: the AI never writes the blockchain logic. It only
> classifies your intent and pulls out parameters; a deterministic
> template engine does all the actual code generation. Everything in the
> demo is real — real Aiken compiler, real CIP-57 blueprint, real
> generated SDK, real Cardano address.

## 2-minute presentation

**The problem (30s).** Cardano has excellent individual tools — Aiken,
Lucid Evolution, Blockfrost — but no project owns the integration between
them. Every team hand-assembles project structure, hand-writes TypeScript
types for datum/redeemer with no compiler-enforced link back to the
validator, and hand-rolls deployment tracking. None of that is domain
logic; all of it is friction before you write a single line of business
logic.

**The solution (45s).** `forge build "Build an escrow smart contract with
milestone-based payments"` — one command — produces a real, compiling
Aiken project, a real CIP-57 blueprint, a typed TypeScript SDK generated
from that blueprint, a passing test, and a real deployment artifact with
a valid Cardano address. The same command also correctly routes an NFT
minting request or a token vesting request to a different real,
compiling contract — three templates today, not a single hardcoded demo
path. Live demo: [show it].

**Why this is trustworthy, not just impressive (30s).** The language
model has exactly two jobs anywhere in this platform: classify your
intent among audited templates, and narrate decisions the system already
made deterministically. It never writes Aiken source. A separate,
deterministic template engine does that. This is why the platform can
explain, after the fact, exactly why it chose a template and why a
parameter has its value — because that reasoning was recorded when the
decision was made, not invented afterward.

**Where it stands (15s).** Feature-complete for this submission across
domain, application, and six real adapters — all verified against the
actual Aiken compiler, not mocks. The next milestone is the eUTxO
security-test generator (`ai-testgen`) — architected and wired in, not
yet implemented; that's the honest, single biggest gap, and we say so in
our own docs.

## 5-minute presentation

Follow [`docs/DemoPlan.md`](DemoPlan.md) directly — it's the full
timed script (problem → live hook → depth pass proving the hook wasn't
staged → architecture → roadmap). The structure in one line: **60 seconds
to show the value, 2.5 minutes to prove it's real, 45 seconds on why the
architecture makes it trustworthy, 45 seconds on what's next.**

---

## FAQ

### On the core design decision

**1. Why doesn't the AI just write the Aiken code directly — wouldn't
that be more flexible?**
Because eUTxO correctness bugs (double satisfaction, missing signer
checks) are exactly the class of mistake a language model can produce
confidently and wrongly, and Aiken has far less training-data
representation than mainstream languages. Flexibility isn't worth that
risk for financial logic. See
[ADR-003](adr/ADR-003-ai-as-intent-parser-only.md).

**2. Isn't this just "ChatGPT writes Aiken" with extra steps?**
No — that's specifically the design we rejected. The model never sees
"write Aiken code" as a task anywhere in this codebase. You can verify
this by reading `packages/adapter-ai/src/` in full; it has two methods,
`extractStructured` and `narrate`, and neither touches a file write.

**3. What happens if my description doesn't match any template?**
Forge stops and refuses to generate a project, rather than guessing.
`SelectTemplateUseCase` computes a match score for the description against
every registered template, and if the best score falls below a confidence
threshold (`--min-confidence`, default 0.6), it throws
`LowConfidenceTemplateMatchError` — an error naming the detected
confidence, the required threshold, and every currently supported
template — before any file is written. Nothing is scaffolded for a
rejected match. The threshold is configurable per run for cases where a
lower bar is intentional.

**4. Is the "AI" here really AI, or just keyword matching?**
It's a deterministic heuristic (keyword-coverage scoring for intent,
digit/number-word extraction for parameters) — deliberately, not by
accident. The task is narrow enough that a transparent heuristic handles
it reliably, and a live demo should never be able to fail because of a
network blip or an API rate limit. See question 6.

### On reliability and the AI backend

**5. Why not use a real hosted LLM (Claude, GPT) for intent parsing?**
We could — `ILanguageModelPort` is an interface, and a hosted backend is
a drop-in future adapter behind the same port. We chose not to for this
submission because the task doesn't need it, and a hosted API call adds a
network dependency and a cost with no reliability upside for classifying
among a handful of known templates.

**6. Doesn't that limit what Forge can ever do?**
It limits what the _intent-parsing step_ does today, not what the
platform can do. Adding a hosted-model adapter later is a new package
implementing an existing port — no core changes required. That's the
whole point of the ports-and-adapters design.

**7. What's your fallback if the Aiken compiler binary isn't available?**
`adapter-aiken` resolves the binary via the `@aiken-lang/aiken` npm
package (no PATH dependency), and `pnpm install` downloads it as part of
a normal install. If it's genuinely unavailable, `forge build` fails
loudly with the compiler's own error — there is no silent degraded mode
for compilation, deliberately, since a "successful" build that didn't
really compile would be worse than an honest failure.

### On what's real vs. not

**8. How do we know the Aiken compilation isn't mocked for the demo?**
Run `pnpm test:integration` yourself — it shells out to the real
`aiken` binary and fetches the real `aiken-lang/stdlib` from GitHub. Or
just run `forge build` and open the resulting `plutus.json` — it's the
compiler's real, verbatim CIP-57 output.

**9. Is the deployment address a real Cardano address?**
Yes — a real CIP-19 bech32-encoded enterprise script address, computed
from the actual compiled script hash, with the correct address-type
nibble and network tag. It's verified by a round-trip encode/decode test
in `adapter-providers`. It has not been submitted to a live network
(there's no real transaction-building pipeline yet — see question 15),
but the address itself is genuine and would resolve correctly on any
Cardano explorer for that network.

**10. What's the single biggest thing that ISN'T built yet?**
`ai-testgen` — the deterministic eUTxO vulnerability rule engine (double
satisfaction, missing signer checks, etc.). The generator port and the
`Rationale`-carrying test pipeline it plugs into are built and wired in;
the rule engine itself isn't written. We say this in the README, the PRD,
the competitive analysis, and `SECURITY.md` — not just here.

**11. Does a passing test mean the contract is secure?**
No, and we're explicit about this: `adapter-emulator` checks for a
spendable UTxO, not a full Plutus/redeemer execution simulation. A
passing `forge build` proves the pipeline works end to end, not that the
generated validator is adversarially safe. See `docs/ProductionReadiness.md`.

### On architecture

**12. Why Clean Architecture for a hackathon project — isn't that
over-engineering?**
It's what let us discover and fix a real bug cheaply: Phase 3 found that
the real CIP-57 output didn't match Phase 2's guessed shape, and fixing
it meant changing one package (`domain`) — every use case and adapter
built against the _port_, not the concrete shape, needed zero logic
changes. That's the architecture paying for itself, not decoration.

**13. Is the plugin system actually used, or just for show?**
Every built-in adapter (`adapter-aiken`, `adapter-emulator`, `adapter-ai`,
etc.) registers through the identical `ForgePlugin`/`PluginContext` API a
third-party plugin would use — there's no privileged core-only path. You
can see this directly in any adapter's `plugin.ts` file.

**14. How would I add support for a new chain-access provider (e.g.
Ogmios)?**
Implement `IChainProviderPort` in a new package, export a
`ForgePlugin` that binds it, and add it to the plugin list passed to
`Forge.create()`. No changes to `application`, `domain`, or any existing
adapter. See `CONTRIBUTING.md`'s "Adding a new port implementation"
section.

**15. What's `ITxBuilderPort`'s actual status?**
Its only implementation (`NotImplementedTxBuilder`) rejects if called —
honestly labeled, tested, and never actually invoked by the shipped
template (which needs no setup transaction). A real off-chain
transaction-building pipeline is the top item after `ai-testgen` on our
roadmap.

**16. Why TypeScript for the generated SDK instead of another language?**
It's the largest audience for Cardano off-chain development today (Lucid
Evolution, Mesh, `cardano-serialization-lib` are all TS/JS-first), and
it's the best-fit target for a "typed client from a machine-readable
interface" pattern, the same one Solana's Anchor uses for its IDL → TS
client generation.

### On Cardano-specificity

**17. Why Aiken instead of writing PlutusTx directly?**
Aiken is the modern, fast-compiling, purpose-built validator language for
Cardano with built-in testing and CIP-57 blueprint output — the
compiler-grade primitive this whole platform is built on top of, not
competing with. See [ADR-005](adr/ADR-005-cip57-first-sdk-generation.md).

**18. What's double satisfaction, and why does it matter that you
mention it so much?**
It's an eUTxO-specific bug where multiple script inputs paid to the same
validator in one transaction can let a single output satisfy more than
one validator's requirement — it has no equivalent on account-based
chains, so generic tooling and generic developer habits don't catch it.
It's the canonical example of why this platform had to be built
Cardano-first rather than ported from an EVM tool.

**19. Does the generated contract handle Native Assets?**
Yes, as of the `nft-minting-royalty` template: it's a real minting policy
that checks `self.mint` for an exact one-unit quantity of a named asset
under its own policy ID, using the same `cardano/assets` module real
Cardano tooling uses. The escrow-milestone and token-vesting templates
still use plain ADA-value UTxOs — native-asset handling is a property of
the specific template, not a platform limitation, and the codegen and
blueprint-parsing layers were asset-shape-agnostic from the start, which
is exactly what let this template ship without touching either layer.

**20. How does this relate to Hydra or Cardano's governance features?**
Not directly used yet. Hydra is a plausible future adapter target behind
the same port abstraction (`IChainProviderPort`/a future `IDevnetPort`
implementation) — see `docs/Vision.md`'s "Why Cardano" section — but
that's explicitly roadmap, not built.

### On process, scope, and honesty

**21. How did this project's scope change over the hackathon?**
Significantly, and deliberately documented at each turn: it started as
"Hardhat/Foundry for Cardano," pivoted to "AI-native platform" after
reviewing evidence from prior hackathon winners, then had two
architectural refinements (AI restricted to intent-only; Explain made
first-class) before implementation resumed. See
`docs/DevelopmentProgress.md` for the phase-by-phase record — nothing in
it has been retroactively cleaned up to look more linear than it was.

**22. What would you build next with more time?**
In order: `ai-testgen` (closes the biggest gap), a real
transaction-building pipeline (unlocks a real `adapter-emulator`), then
breadth — more templates, more chain providers, a VS Code extension built
on the same `@forge/sdk` facade the CLI uses. Full detail in
`docs/FinalEngineeringReport.md`.

**23. Is this open source? What license?**
Apache 2.0 — the same license Aiken itself uses, and consistent with the
broader IntersectMBO/Cardano tooling ecosystem. `CONTRIBUTING.md`,
`CODE_OF_CONDUCT.md`, and issue/PR templates are all in place.

**24. How is this tested, concretely?**
150 fast unit tests (offline, a few seconds — `pnpm test`) plus 8
integration tests that really invoke the Aiken compiler and real network
access (~40 seconds — `pnpm test:integration`). Fixtures for compiler
JSON output were captured verbatim from real runs, not hand-written
guesses.

**25. What's the hardest engineering call made in this project, and why?**
Deciding `adapter-ai` should be local and dependency-free rather than
hosted-API-backed. It was tempting to reach for "real AI" for the demo's
sake, but the actual task (classify among a few templates, extract a
number) doesn't need it, and a hosted dependency trades demo reliability
for a capability improvement we couldn't actually use yet with only one
template. Choosing the boring, reliable option over the more impressive-
sounding one was the right call for a live demo.

**26. Who is this for, realistically, right now?**
An individual developer or small team prototyping an escrow, NFT-minting,
or vesting contract on Cardano who wants a fast, typed, tested starting
point — not yet a team shipping to mainnet without independent review,
and not yet a team needing a contract shape outside these three.

**27. What's the release/versioning plan?**
Every package follows semver independently via Changesets, all currently
at `0.0.0` (nothing published yet, deliberately — see
`docs/ReleaseProcess.md`). Publishing is a manual, maintainer-triggered
step, not automated on merge, until there's a real cadence of changes to
justify automating it.
