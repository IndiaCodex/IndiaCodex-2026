# Judge Cheat Sheet

One page. Everything below is verifiable by running the commands shown —
none of it requires taking our word for it.

## What Forge is, in one sentence

Describe a Cardano smart contract in plain English; get back a real,
compiled Aiken project, a typed TypeScript SDK, passing tests, and a
deployment artifact — with the language model kept strictly out of the
one place it can't be trusted: writing the blockchain logic itself.

## The one rule that makes this trustworthy

**The language model never writes Aiken source.** It only classifies
intent and extracts parameters; a separate, deterministic template engine
renders every line of contract code. See
[ADR-003](adr/ADR-003-ai-as-intent-parser-only.md).

## 60-second verification

```bash
pnpm install && pnpm build
node packages/cli/dist/bin.js build "Build an escrow smart contract with milestone-based payments"
```

Real Aiken compilation, real CIP-57 blueprint, real typed SDK, real test
run, real CIP-19 deployment address — all in about ten seconds. Full
detail: [Judge quick start](../README.md#judge-quick-start-2-minutes) in
the root README.

## What's real vs. roadmap

| Real today                                                          | Roadmap, not built                                     |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| Real Aiken compilation (not mocked)                                 | `ai-testgen` — eUTxO vulnerability rule engine         |
| 3 audited templates (escrow, NFT royalty mint, vesting)             | A 4th template and beyond                              |
| Confidence-gated template matching (rejects low-confidence guesses) | Real off-chain transaction building (`ITxBuilderPort`) |
| Real CIP-19 deployment address + versioned manifest                 | Real local devnet (`adapter-devnet`)                   |
| 150 unit tests + 8 real integration tests, all passing              | Additional presentation layers (VS Code, web)          |

Full matrix with test coverage per row:
[`docs/FinalEngineeringReport.md`](FinalEngineeringReport.md).

## The single biggest known gap

`ai-testgen` (the eUTxO vulnerability rule engine — double satisfaction,
missing signer checks) is architected and wired into the pipeline, but no
rule engine is registered yet — `forge build` correctly reports zero
findings rather than fabricating any. This is disclosed in `SECURITY.md`,
`docs/ProductionReadiness.md`, and here — not something found on
inspection.

## Common questions, answered fast

- **Isn't this just an LLM writing Aiken with extra steps?** No — read
  `packages/adapter-ai/src/` in full (two methods:
  `extractStructured`, `narrate`); neither touches a file write.
- **Does a passing test mean the contract is secure?** No —
  `adapter-emulator` checks for a spendable UTxO, not a full
  Plutus/redeemer simulation. Stated plainly in
  [`docs/ProductionReadiness.md`](ProductionReadiness.md).
- **Why Clean Architecture for a hackathon project?** It's what let Phase
  3 discover the real CIP-57 shape didn't match an earlier guess, and fix
  it by changing exactly one package (`domain`) — every adapter built
  against the port needed zero changes.
- **25 more, with full answers:** [`docs/JudgePreparation.md`](JudgePreparation.md).

## Where everything lives

- Pitches (30s / 2min / 5min) + full FAQ: [`docs/JudgePreparation.md`](JudgePreparation.md)
- Honest strengths/weaknesses/security assessment: [`docs/ProductionReadiness.md`](ProductionReadiness.md)
- Architecture, diagrams, ports, use cases: [`docs/Architecture.md`](Architecture.md)
- Five-minute demo script: [`docs/DemoPlan.md`](DemoPlan.md)
- One-page project summary: [`../EXECUTIVE_SUMMARY.md`](../EXECUTIVE_SUMMARY.md)
