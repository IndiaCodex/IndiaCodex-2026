# Vision

## What problem are we solving?

Cardano has best-in-class individual pieces for smart contract development —
Aiken as a modern validator language and compiler, Lucid Evolution and Mesh as
off-chain transaction libraries, Blockfrost/Ogmios/Kupo as chain-access
backends — but no coherent **platform** tying them into one workflow. Every
team currently hand-assembles its own project layout, hand-writes datum and
redeemer encoding/decoding against the off-chain library, hand-rolls a
deployment tracking scheme, and hand-writes (or skips) tests for
eUTxO-specific failure modes.

The cost of this gap shows up in three concrete ways:

1. **Onboarding friction.** A new Cardano developer must learn Aiken, an
   off-chain library, a chain-access provider, and invent a project structure
   before writing a line of business logic. There has been no
   `create-react-app`-style scaffolding tool for this stack.
2. **Manual, error-prone glue code.** Datum/redeemer shapes are defined once
   in Aiken and then re-typed by hand in TypeScript, with no compiler-enforced
   link between the two. Shape drift after a validator change is a silent
   runtime failure, not a build error.
3. **Security blind spots specific to eUTxO.** Bugs like double satisfaction
   have no equivalent in account-based chains, so generic security tooling
   and generic developer habits don't catch them. Today, catching these
   requires an experienced auditor or a slow manual review — there's no
   tooling that surfaces them automatically at development time.

We are building the missing integration layer: scaffolding, compilation,
typed SDK generation, testing (unit, property, and emulator-based
integration), and deployment orchestration, unified behind one extensible
platform — plus a first-of-its-kind automated check for Cardano-specific
vulnerability classes.

## Why now?

- **Aiken has reached the maturity to build on top of.** Its compiler,
  built-in property-based testing (fuzzers), and the CIP-57 blueprint
  standard (a machine-readable contract interface, analogous to an ABI) are
  stable enough that a platform doesn't have to fight an unstable foundation.
  CIP-57 in particular is the enabling primitive for the typed-SDK
  differentiator — it didn't exist in a usable form until relatively
  recently.
- **Post-Chang, Conway-era Cardano is attracting more serious on-chain
  logic** (governance, DeFi, RWA tooling), which raises the bar for what
  "production quality" contract development needs to look like. Ad hoc
  tooling that was tolerable for simple scripts doesn't scale to teams
  shipping audited, high-value contracts.
- **Cardano hasn't had its "Hardhat moment."** Ethereum's developer
  experience inflected sharply once scaffolding, testing, and deployment
  were unified behind one tool with a plugin ecosystem. Solana had the same
  inflection with Anchor. Cardano has the compiler-grade primitive (Aiken)
  but not yet the platform layer on top of it — the gap is well-known in the
  ecosystem and squarely fillable today.
- **Hackathon and grant-funded activity (Catalyst, IndiaCodeX, and similar)
  is actively growing the builder base.** Lowering time-to-first-deployed
  contract is a direct lever on how many of those builders actually ship,
  and is exactly the kind of infrastructure investment that keeps paying off
  after any single hackathon ends.

## Why Cardano?

- **The eUTxO model has failure modes no other tooling targets.** Double
  satisfaction, UTxO contention, and deterministic script-evaluation cost
  accounting are Cardano-shaped problems. A platform built chain-agnostically
  (or ported from an EVM tool) would miss all of them by construction — this
  has to be built Cardano-first to be useful.
- **The on-chain/off-chain split is more pronounced than on account-based
  chains.** Validators are pure functions; all transaction construction,
  balancing, and UTxO selection happens off-chain. That means the _quality
  of the off-chain SDK_ is a much larger fraction of the actual developer
  experience on Cardano than it is on, say, Ethereum — which makes a strong,
  typed, auto-generated SDK disproportionately valuable here specifically.
- **CIP-57 gives us a standardized, machine-readable contract interface
  today**, which is the precondition for reliable codegen. Building the
  same idea on a chain without an equivalent standard would mean building
  and maintaining our own interface format first — Cardano lets us skip
  straight to the valuable part.

## Why existing tools are insufficient

| Tool                              | What it does well                                                                     | Where it stops                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aiken**                         | Excellent validator compiler, built-in unit/property testing, CIP-57 blueprint output | Stops at the language boundary — no scaffolding, no off-chain integration, no deployment tracking                                             |
| **Lucid Evolution / Mesh**        | Solid off-chain transaction building, an in-memory emulator for fast tests            | No opinionated project structure, no generated link back to on-chain blueprint types — datum/redeemer encoding is still commonly hand-written |
| **Yaci DevKit / cardano-testnet** | Solve the local-devnet problem well                                                   | Don't address scaffolding, codegen, or deployment-manifest tracking at all                                                                    |
| **Ad hoc team scripts**           | Get a specific team's project working                                                 | Bespoke per project, not reusable, not extensible, and rarely include any systematic security testing                                         |

No existing tool combines scaffolding, typed codegen from CIP-57, unified
on-chain + off-chain testing, deployment orchestration, and an automated
eUTxO-specific security-test generator into one coherent, pluggable
platform. That combination — not any single piece of it — is the gap this
project fills.

## The AI-native evolution

The platform's positioning has evolved from "a unified developer platform
with one automated security-test generator" to **an AI-native Cardano
developer platform**: a developer can describe what they want in plain
English and receive a scaffolded, compiled, typed, tested, reviewed,
documented, deployment-ready Cardano project. This does not change the
underlying problem analysis above — it changes how compellingly the fix is
delivered, and it adds one new, load-bearing design constraint that keeps
the claim credible to an experienced Cardano engineer rather than
inviting the obvious, deserved skepticism of "an LLM wrote my smart
contract":

**The language model is never responsible for generating blockchain
logic.** Its role is strictly limited to two things: (1) interpreting a
natural-language request into structured intent and parameters, and (2)
narrating, in plain language, decisions and facts the platform has
already computed deterministically. The actual Aiken source is always
produced by a deterministic template-rendering engine, from an audited
template plus validated parameters — never freehand-generated. This
mirrors, and extends, the same principle the original security-test
generator was already built on (a deterministic rule engine finds the
bug; the AI, if configured, only narrates why it matters).

**Explain is a first-class capability, not a side effect.** Every
generated artifact — the chosen template, each parameter, each validator,
each generated test — carries a structured, deterministic reason it
exists. The platform can surface that reasoning on demand: why this
template was selected, why a parameter has the value it does, why a
validator exists, why a test was generated, and the underlying eUTxO,
CIP-57, and security considerations behind each. As with generation, the
language model's role here is narration of facts the platform already
knows, not independent judgment — the explanation is auditable back to
the deterministic decision that produced it.
