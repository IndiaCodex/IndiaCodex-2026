# Business Case

This document justifies why Forge should exist, for an audience that will
scrutinize the claim: Cardano Foundation engineers, hackathon judges,
Project Catalyst reviewers, and potential open-source contributors. Where a
claim is an established fact about existing tooling, it is stated plainly.
Where a claim is a projection or design assumption, it is labeled as such.
No statistic in this document is invented; where a number would normally
appear, we describe the mechanism instead and defer the number to the
[Success Metrics](#success-metrics) section as something to be measured,
not asserted in advance.

This document is consistent with, and should be read alongside,
[Vision.md](./Vision.md), [PRD.md](./PRD.md), [Architecture.md](./Architecture.md),
[CompetitiveAnalysis.md](./CompetitiveAnalysis.md), and [DemoPlan.md](./DemoPlan.md).

## Executive Summary

**What is Forge (working name)?** Forge is a modular, open-source,
AI-native developer platform for Cardano smart contract development. A
developer can describe what they want in plain English and receive a
scaffolded, compiled, typed, tested, reviewed, documented, deployment-ready
Cardano project — and every step below that natural-language entry point
still exists as an independent, unified capability: Aiken compilation,
CIP-57-blueprint-driven TypeScript SDK generation, on-chain and off-chain
testing, and deployment orchestration, all behind a single,
plugin-extensible core (see [Architecture.md](./Architecture.md) for the
full component design). An automated eUTxO-specific security-test
generator is architected for and wired into the same pipeline, but the
rule engine itself is not implemented yet — see the roadmap. The
language model is deliberately restricted to two responsibilities —
interpreting intent and narrating decisions the platform already made
deterministically — and never generates blockchain logic directly; a
separate, deterministic template-rendering engine is the only thing that
ever produces Aiken source. That separation, not the natural-language
interface by itself, is what this business case argues should earn Forge
credibility with engineers who are (rightly) skeptical of AI-generated
smart contracts.

**What problem does it solve?** Cardano's individual developer tools —
Aiken, Lucid Evolution, Blockfrost, Ogmios, Koios — are each solid, but
building a production application today requires manually wiring them
together, hand-writing the link between on-chain and off-chain type
definitions, and assembling a testing and deployment workflow from scratch
for every project. Forge replaces that manual integration work with a
maintained, tested, common core.

**Why is it important?** Developer tooling quality is a direct input to
ecosystem growth: the easier it is to go from an idea to a tested, typed,
deployed Cardano contract, the more builders convert from "interested" to
"shipped." Ethereum's and Solana's tooling inflections (Hardhat/Foundry,
Anchor) are established, observable precedents for this effect (see
[Competitive Analysis](./CompetitiveAnalysis.md)); Cardano has the
compiler-grade primitive (Aiken) and the interface standard (CIP-57) this
requires, but not yet the unifying platform layer.

## Problem Statement

The following describes the current Cardano smart-contract developer
workflow as it exists using official and widely adopted tooling, prior to
any Forge-specific claims.

**Fragmented tooling.** A production Cardano dApp today typically composes:
Aiken (on-chain validator language and compiler), an off-chain library such
as Lucid Evolution or Mesh (transaction building, wallet integration), and
a chain-access backend — Blockfrost (hosted API), Ogmios (direct
`cardano-node` bridge), or Koios (community-run federated API). Each of
these is maintained by a different team or organization, with its own
release cadence, documentation site, and conventions. No single project
currently owns the integration between them end to end.

**Steep onboarding.** A developer new to Cardano must, before writing any
business logic, choose and learn a validator language (Aiken vs. PlutusTx),
choose an off-chain library, choose a chain-access backend, and invent a
project folder structure — none of which is domain logic, all of which is
prerequisite plumbing. The Cardano Developer Portal documents each tool
individually; it does not prescribe a single starter workflow the way, for
example, a single scaffolding command does in other ecosystems.

**Manual SDK creation.** Aiken produces a CIP-57 blueprint (`plutus.json`)
describing each validator's parameters, datum, and redeemer shapes in a
machine-readable format. In current common practice, developers re-type
these shapes by hand as TypeScript types for use with Lucid Evolution or
Mesh, because no widely adopted tool consumes the blueprint automatically
to generate that binding.

**Serialization errors.** Because the on-chain schema and the off-chain
type definitions are maintained separately and by hand, a change to a
validator's datum or redeemer shape does not produce a compiler error in
the off-chain code — it produces a runtime transaction-building or
script-evaluation failure, discovered later and at a less convenient time
than a build step.

**Disconnected testing workflow.** Aiken has built-in unit and
property-based (fuzzer) testing for validator logic in isolation. Testing
full transaction flows — building a transaction with a real wallet UTxO
set, submitting it, and asserting on the resulting chain state — requires
a separate off-chain testing setup, commonly Lucid Evolution's emulator or
a local devnet. These two testing surfaces are not unified today: a
developer runs `aiken check` for on-chain logic and a separate,
project-specific script or test suite for off-chain flows, with no shared
report.

**Deployment complexity.** Deploying a validator involves computing its
script address (dependent on any constructor parameters), potentially
submitting setup transactions (e.g., depositing a reference script), and
tracking which script version is live on which network. There is no widely
adopted standard artifact for this today; teams commonly track deployment
addresses in ad hoc notes, READMEs, or environment files rather than a
versioned, diffable manifest.

**Plugin ecosystem limitations.** Aiken, Lucid Evolution, Blockfrost,
Ogmios, and Koios are each independently extensible or configurable within
their own scope, but there is no shared extensibility layer spanning
scaffolding, compilation, codegen, testing, and deployment together. A team
that wants to add a new chain-access backend or a custom deployment check
today must modify their own project's glue code, because there is no
common plugin surface to extend instead.

## Why Existing Tools Are Not Enough

| Tool                  | What it is                                                                                                                         | What it does well                                                                        | Where the gap is                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Aiken**             | Modern smart-contract language, compiler, and test runner for Cardano validators                                                   | Fast compilation, built-in unit and property-based testing, produces a CIP-57 blueprint  | Stops at the language boundary — no scaffolding, no off-chain integration, no deployment tracking              |
| **Lucid Evolution**   | TypeScript library for building and submitting Cardano transactions off-chain                                                      | Actively maintained, includes an in-memory emulator for fast testing without a live node | Does not consume CIP-57 blueprints automatically; datum/redeemer types are commonly written by hand against it |
| **Blockfrost**        | Hosted API service for querying Cardano chain data                                                                                 | Reliable, well-documented, low setup effort                                              | A data-access backend only — no role in scaffolding, codegen, testing, or deployment tracking                  |
| **Ogmios**            | Lightweight WebSocket bridge to a local `cardano-node`                                                                             | Direct, low-latency chain sync and query access without a hosted intermediary            | Same scope limitation as Blockfrost — a chain-access layer, not a development workflow                         |
| **Koios**             | Community-run, federated REST API for Cardano chain data                                                                           | Decentralized alternative to a single hosted provider                                    | Same scope limitation as Blockfrost/Ogmios                                                                     |
| **CIP-57 Blueprints** | Cardano Improvement Proposal defining a machine-readable interface format for Plutus scripts (parameters, datum, redeemer schemas) | Standardizes what a validator's interface looks like, enabling tooling interoperability  | The standard exists, but no widely adopted tool consumes it to generate a typed off-chain SDK end to end       |

Each of these is excellent at the specific problem it was built to solve.
The gap is not in any one of them — it is in the absence of a project that
owns the integration between them for the full build-test-deploy
lifecycle. That is the gap Forge is scoped to fill, and it is why Forge is
designed as an orchestration and codegen layer on top of these tools rather
than a replacement for any of them (see [Architecture.md](./Architecture.md)
for how `adapter-aiken`, `adapter-emulator`, and `adapter-providers` wrap
or stand in for these tools behind stable ports rather than reimplementing
their function).

## Proposed Solution

Forge unifies the lifecycle by putting one platform core behind a set of
ports, and adapting each existing tool to a port rather than asking
developers to wire the tools together themselves (full detail in
[Architecture.md](./Architecture.md)):

- Aiken is invoked through `adapter-aiken`, which also parses its CIP-57
  output into a shared domain `Blueprint`.
- That `Blueprint` drives `adapter-codegen-ts`, which generates the typed
  TypeScript SDK a hand-written integration currently requires.
- The same `Blueprint` drives on-chain testing (native Aiken) and
  off-chain testing (a self-built in-memory ledger via `adapter-emulator`),
  reported through one unified test report.
- The same `Blueprint` is designed to drive `ai-testgen`, which would check
  it against a curated list of eUTxO-specific vulnerability patterns and
  generate targeted tests automatically — the generator port and pipeline
  are wired in, but the rule engine itself is not implemented yet (see the
  roadmap).
- Deployment reads the `Blueprint`, computes a real CIP-19 script address
  through `adapter-providers`, and writes a versioned manifest instead of
  an ad hoc note. Blockfrost, Ogmios, and Koios chain access are
  architecturally supported through the same port abstraction; each is a
  roadmap item, not an MVP claim.
- Every one of the above is a plugin bound to a port — including the
  built-in adapters themselves — so a team or third party can replace any
  piece without forking the core.
- A natural-language description drives the same pipeline end to end: a
  language-model port (`ILanguageModelPort`) parses intent and extracts
  parameters, a deterministic template engine (`IContractTemplateEnginePort`,
  the "Forge Engine") renders the actual Aiken source from an audited
  template, and from that point on the generated project flows through
  the exact same compile/codegen/test/deploy pipeline described above —
  compilation does not know or care whether a human or the template
  engine wrote the source. Every decision the pipeline makes (which
  template, why a parameter has its value) is recorded as a structured
  reason and printed automatically at the end of every `forge build` run
  today; querying it on demand for an already-built project, standalone,
  is scoped future CLI surface.

### Before vs. after

| Step                                    | Today (manual integration)                                                                               | With Forge                                                                                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Starting a project                      | Manually create folder structure, install and wire Aiken + an off-chain library + a chain-access backend | `forge build "<description>"` generates a complete, compiled, tested project from a sentence                                                                                          |
| Datum/redeemer types                    | Hand-written in TypeScript, no compiler-enforced link to the validator                                   | Generated from the CIP-57 blueprint by `adapter-codegen-ts`; a validator shape change produces a TypeScript type error, not a silent runtime failure                                  |
| Testing                                 | Separate, uncoordinated on-chain (`aiken check`) and off-chain (project-specific) test setups            | Native Aiken tests and an emulator-based functional check run together with one unified report, as part of `forge build`                                                              |
| Security review for eUTxO-specific bugs | Manual, dependent on individual reviewer experience, or skipped                                          | Architected and wired end to end (`GenerateSecurityTestsUseCase`); the curated eUTxO rule engine itself (`ai-testgen`) is the single largest gap still to be filled — see the roadmap |
| Understanding why a decision was made   | Tribal knowledge, or not recorded at all                                                                 | Printed automatically at the end of every `forge build` run, surfacing the deterministic reason behind the template choice and each parameter                                         |
| Deployment tracking                     | Ad hoc notes, READMEs, or environment files                                                              | A versioned, diffable `DeploymentManifest` per network, with a real CIP-19 address, written automatically                                                                             |
| Extending the workflow                  | Modify each project's own glue code                                                                      | Implement a port and register a plugin; no core fork required (proven by every built-in adapter using the identical mechanism)                                                        |

## Value Proposition

**New developers.** The largest reduction in friction: one sentence to
`forge build` produces a working, compiled, tested project instead of a
sequence of independent tool-installation and wiring decisions, and the
generated SDK removes the need to understand Cardano's CBOR/datum
encoding details before writing a first working transaction. The
automatic "why this template" / "why these parameters" output gives a new
developer a way to see the reasoning behind anything the platform
generated, turning the generated project into a learning artifact rather
than an opaque one.

**Experienced Cardano developers.** The value is in removing repetitive,
low-judgment work — re-typing datum shapes, re-building a deployment
tracking scheme per project, remembering to check for double satisfaction
by hand — so experienced time is spent on actual contract logic instead of
integration plumbing that has already been solved once, correctly, in the
platform.

**Open-source maintainers.** A stable, documented port and plugin API means
a maintainer of an adjacent tool (a new chain-access backend, a new
off-chain library) can integrate with Forge by implementing a port, gaining
distribution to Forge's user base, without needing Forge's core team to do
that integration work themselves.

**Enterprise teams.** A versioned deployment manifest and unified test
reporting are exactly the artifacts an enterprise team needs for internal
review and audit preparation — they turn tribal knowledge (where is this
deployed) into committed, reviewable repository state. An automated
baseline security check (a curated eUTxO vulnerability rule engine) is
architected for and wired into the pipeline already but not yet
implemented — see the roadmap; today this value proposition is partial.
The deterministic-generation guarantee matters
specifically here: an enterprise reviewer can be told, and verify, that no
deployed validator logic was freehand-written by a language model — every
generated contract traces back to an audited template and a validated,
inspectable parameter set, and the platform's explain output makes that
provenance visible rather than merely asserted.

**Cardano ecosystem.** Lower time-to-first-deployed-contract and a common,
opinionated best-practice path both increase the rate at which
grant-funded, hackathon, and independent builders actually ship working
contracts rather than stalling on tooling setup — directly serving the
ecosystem-growth goals shared by Project Catalyst and similar programs (see
[Project Catalyst Alignment](#project-catalyst-alignment)).

## Why Cardano

Forge is designed specifically for Cardano's execution model, not as a
generic blockchain framework with a Cardano backend bolted on. This
distinction matters because several of the platform's core capabilities
only make sense given Cardano-specific primitives:

- **eUTxO.** Cardano's extended UTxO model has failure modes — most
  notably double satisfaction, where multiple script inputs paid to the
  same validator in one transaction can allow a single output to satisfy
  more than one validator's requirement — that do not exist on
  account-based chains. Forge's vulnerability rule engine is built around
  this model specifically; a generic multi-chain tool would have no
  concept of the bug class in the first place. This is also why Forge's
  AI-native generation is template-constrained rather than freehand: eUTxO
  correctness bugs are exactly the class of subtle, high-consequence
  mistake a language model can produce confidently and wrongly, with far
  less training exposure to Aiken than to account-based-chain languages —
  a risk that is specific to this execution model, not a generic caveat
  about AI-generated code.
- **CIP-57.** The blueprint standard is the precondition for Forge's typed
  SDK generation. Without a standardized, machine-readable interface
  format, codegen would require either a bespoke interface format (as
  Forge would have had to invent on a chain without one) or would not be
  reliably possible at all.
- **Aiken.** Aiken's compiler and built-in property-based testing are the
  on-chain foundation Forge builds on rather than reimplements. Forge's
  value is in what happens around Aiken's output (the blueprint), not in
  competing with Aiken as a language.
- **Native Assets.** Cardano's ledger-level multi-asset support means
  tokens are first-class values rather than separate contracts (unlike an
  ERC-20-style token, which is itself a smart contract). This changes what
  "vulnerability patterns" look like for token-handling validators (e.g.,
  checking policy ID and token name pinning rather than checking an
  external contract's balance mapping), and Forge's rule engine reflects
  that.
- **Plutus.** Aiken compiles to Plutus Core, and validator behavior is
  scoped by Plutus version (the Chang hard fork's introduction of Plutus V3
  is a relevant example, enabling new script purposes tied to on-chain
  governance). Forge's blueprint parsing and generated SDK are designed to
  track the Plutus version a given validator targets rather than assuming
  a single fixed version indefinitely.
- **Hydra.** Cardano's isomorphic state-channel layer-2 protocol is not an
  MVP dependency, but it is a natural adapter target for the same
  `IDevnetPort`/`IChainProviderPort` abstraction Forge already defines — high-
  throughput off-chain testing against a Hydra head is a plausible
  post-MVP extension precisely because the ports are already designed to
  be backend-agnostic. This is a roadmap possibility, not a current
  capability.
- **Official SDK ecosystem.** Cardano's off-chain tooling landscape (Lucid
  Evolution, Mesh, `cardano-serialization-lib`, `cardano-client-lib`,
  PyCardano) is genuinely rich, but fragmented — each solves the
  transaction-building problem well, independently. Forge does not seek to
  replace this ecosystem; real off-chain transaction building sits behind
  a port (`ITxBuilderPort`) specifically so that a future implementation
  (Lucid Evolution, Mesh, or a non-TypeScript SDK) is a plugin change, not
  a rewrite. Today that port's only implementation is an honest stub that
  rejects if called — see the roadmap.

## Business Impact

The following are reasoned, qualitative expectations based on the
mechanism each capability provides, not measured results — they should be
read as hypotheses this project intends to validate, with the concrete
measurement approach described in [Success Metrics](#success-metrics).

**Developer productivity.** Scaffolding, codegen, and unified testing each
remove a category of manual, repetitive work described in the
[Problem Statement](#problem-statement). The expected effect is fewer hours
spent on integration plumbing per project and more time available for
contract logic. We do not have a measured baseline to cite a magnitude
against; this should be validated by comparing time-to-first-passing-test
for a new project with and without Forge once the MVP is usable end to end.

**Onboarding time.** Removing the need to independently choose and wire an
off-chain library and a chain-access backend before writing any business
logic should reduce the number of decisions and setup steps a new
developer faces before their first working transaction. The mechanism is
straightforward (fewer prerequisite decisions); the size of the effect is
unmeasured and should be validated with new-developer onboarding sessions
post-MVP.

**Defect reduction.** Two independent mechanisms plausibly reduce
defects: (1) generated, typed datum/redeemer bindings convert a class of
silent runtime serialization failures into compile-time type errors, and
(2) the automated vulnerability rule engine surfaces a specific, named set
of eUTxO bug patterns at development time rather than relying on reviewer
memory. Both are mechanisms with a clear causal story; neither has a
measured defect-rate reduction attached to it yet, and none should be
claimed until there is real usage to measure against.

**Code quality.** A shared, tested platform core for scaffolding, testing,
and deployment tracking means these concerns are implemented once, with
their own test suite (see NFR4 in [PRD.md](./PRD.md)), rather than
reimplemented per project with varying rigor. This plausibly raises the
floor of code quality across projects that adopt Forge, though it does not
guarantee the quality of a given team's own contract logic.

**Ecosystem adoption.** If the productivity and onboarding effects above
hold even directionally, the mechanism for ecosystem impact is a lower
barrier between "interested in building on Cardano" and "has a working,
tested, deployed contract" — which is the same lever hackathon and grant
programs already try to pull through education and documentation
investment. Forge is a tooling investment aimed at the same lever.

## Open Source Strategy

**Governance.** Initial governance is a small maintainer team (the
project's founding contributors) with final say over the port and plugin
API surface specifically, since that is the platform's stable contract and
changes to it affect every adapter and plugin. Changes to individual
adapters or the CLI's presentation layer require a lower bar of review than
changes to `domain`, `plugin-api`, or `application`. As the contributor
base grows, the intent is to move toward a documented maintainer-ladder
model (contributor → reviewer → maintainer) rather than keeping all
decision authority permanently concentrated — this is a stated intent, not
a commitment with a fixed timeline.

**Contribution model.** Standard open-source mechanics: a `CONTRIBUTING.md`
describing local setup and PR expectations, issue labels distinguishing
good-first-issues from architecture-affecting changes, and a lightweight
RFC-style process specifically for proposed changes to port interfaces or
the plugin contract (given how much depends on that surface staying
stable, per NFR3 and NFR8 in [PRD.md](./PRD.md)).

**Plugin marketplace vision.** The near-term mechanism is a naming
convention (`forge-plugin-*` on npm) plus a curated list maintained in the
repository, similar in spirit to how Hardhat's plugin ecosystem is
discovered today. A dedicated plugin registry or marketplace site is a
later-stage possibility once there are enough third-party plugins to
justify one — this is explicitly roadmap, not an MVP or near-term
commitment.

**Documentation strategy.** Documentation lives in the repository as code
(`docs/`), versioned alongside the packages it describes, with a
per-package README requirement (NFR5) and a dedicated plugin-authoring
guide so that extending the platform does not require reading source code
first. Architecture documentation (this set of files) is treated as a
source of truth that must be updated in the same PR as any change that
would make it inaccurate.

**Community roadmap.** Immediately after the hackathon: publish the repository, tag the MVP, and open issues for the post-MVP roadmap items already listed in [PRD.md](./PRD.md) and [Architecture.md](./Architecture.md) so early contributors have concrete, scoped entry points rather than an open-ended "help wanted." Sustained maintenance beyond initial hackathon effort is a resourcing question this document does not resolve on its own; see [Project Catalyst Alignment](#project-catalyst-alignment) for one plausible path to funded continuation.

## Project Catalyst Alignment

Project Catalyst's recurring funding categories include developer tooling
and ecosystem infrastructure, on the stated premise that lowering the cost
of building on Cardano grows the number of people who do. Forge is
positioned as exactly that kind of infrastructure investment rather than a
consumer-facing application: it does not compete for end users, it reduces
the cost of every team that goes on to build one.

Three concrete alignment points:

1. **Public-good, non-exclusive tooling.** Forge is open source, has no
   business model that depends on restricting access, and its value
   compounds with adoption (more usage surfaces more plugin needs, which
   grows the plugin ecosystem) — the same dynamic Catalyst-funded public
   goods are intended to produce.
2. **Fills a documented gap rather than duplicating funded work.** The
   [Competitive Analysis](./CompetitiveAnalysis.md) shows no existing
   Cardano tool combines scaffolding, CIP-57-driven codegen, unified
   testing, and automated eUTxO-specific security-test generation; this is
   additive to the existing tooling landscape (Aiken, Lucid Evolution,
   Blockfrost, Ogmios, Koios), not a competing reimplementation of any of
   it.
3. **Sustainability path fits Catalyst's funding model.** A hackathon
   produces a credible MVP and a working demo; sustained maintenance,
   the devnet integration roadmap item, and community plugin growth are
   the kind of scoped, milestone-based follow-on work Catalyst proposals
   are structured to fund. This document does not assume future Catalyst
   funding will be sought or granted — it notes the fit as a plausible
   path, to be pursued as a separate, explicit decision.

## Long-Term Vision

**0–3 months (post-hackathon).** Stabilize the MVP scope defined in
[PRD.md](./PRD.md): publish the repository, tag a first release, write the
plugin-authoring guide, and open the roadmap issues so early adopters and
contributors have a concrete starting point.

**3–9 months.** Deliver the first post-MVP roadmap items in priority order
as scoped in [PRD.md](./PRD.md) and [Architecture.md](./Architecture.md):
real local-devnet integration (`adapter-devnet`), additional chain
providers (Ogmios+Kupo, Koios, Maestro) alongside the MVP's Blockfrost
support, and the optional local-LLM explainer enhancement to
`ai-testgen`. By this point, whether external contributors have begun
implementing their own plugins is a meaningful signal of whether the
extensibility design is actually working in practice, not just in theory.

**9–24 months.** If adoption and contribution signals from the earlier
phases are positive, invest in the additional presentation layers already
scoped as architecturally free given the `platform-sdk` boundary (a VSCode
extension, a web playground), a reusable CI/CD GitHub Action, and a
curated or formal plugin registry. A Hydra adapter, explored under the
same port abstraction used for devnet and chain providers, is a plausible
item in this window given sufficient community or funded interest, but is
not a commitment made by this document.

Each phase is conditional on the signals from the phase before it — this
is a staged plan, not a guaranteed trajectory, and later phases should be
revisited rather than executed by default if earlier adoption signals do
not materialize.

## Success Metrics

The following are proposed KPI categories and, where noted, proposed
initial milestone thresholds for discussion — not measured current
statistics, since none exist yet for a project that has not shipped. Actual
targets should be set (or these revised) once the MVP has been public for
a period long enough to establish a baseline.

| KPI                             | What it measures                                                                                                             | Proposed early milestone (to be reviewed, not a committed figure)                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub stars                    | Passive awareness/interest signal                                                                                            | Directional only — useful as a trend, not a target in isolation                                                                          |
| Contributors (non-founding)     | Whether the contribution model in practice lowers the bar to a first external PR                                             | At least one external contributor within the first few months of public release                                                          |
| Plugin count (`forge-plugin-*`) | Whether the port/plugin API is actually usable by someone who isn't the core team                                            | First third-party plugin as the key milestone — proves extensibility works outside the founding team, more meaningful than the raw count |
| Package downloads (npm)         | Actual usage, as distinct from passive interest                                                                              | Track trend from first release; no baseline exists to set a target against yet                                                           |
| Projects using Forge            | Real-world adoption beyond the reference example                                                                             | A small, explicit showcase list in the repository, added as projects opt in, rather than an inferred or estimated count                  |
| Community adoption signals      | Qualitative: mentions in Cardano developer forums/Discord, inclusion in community tooling lists, use in a bootcamp or course | Tracked as evidence, not reduced to a single number                                                                                      |

These metrics should be reviewed together, not optimized individually —
for example, star count without any external contributors or plugins would
indicate awareness without adoption, which is not the outcome this project
is aiming for.
