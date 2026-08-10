# Adaptive Concurrency-Aware Batcher — Documentation

Reusable, adaptive off-chain batching infrastructure for Cardano dApps, plus an on-chain
Aiken settlement validator. Built for the **Cardano IndiaCodex'26 Hackathon** (General Track,
Preprod testnet).

> **One line:** a shared "batcher" that any Cardano dApp can plug into — it detects which pending
> user requests collide over the same UTXO, measures live network congestion, picks the largest
> non-conflicting group, and settles them all in **one transaction** instead of many failing ones.

> ## 🚨 6-HOUR BUILD? Start here
> The hackathon window is 6 hours. Read in this order:
> 1. [`../AGENT.md`](../AGENT.md) — the binding operating guide (invariants, house style, checklist).
> 2. [`6hr-sprint.md`](./6hr-sprint.md) — the **governing plan**: scoped roles, hour-by-hour timeline,
>    fallback ladder. Supersedes `roadmap.md` (the 10-day version).
> 3. [`build-plan.md`](./build-plan.md) — the **granular execute-top-to-bottom TODO**: exact commands,
>    the Aiken validator to copy, API/UI code, acceptance criteria per step.
>
> The other docs below are the reference detail those two plans point into.

---

## Read in this order

**If you have 5 minutes (judges, teammates, newcomers):**
1. [`glossary.md`](./glossary.md) — the vocabulary. eUTXO, UTXO contention, contention graph,
   MIS, EWMA, CIP-30. Read this first if any of those are unfamiliar.
2. This README's ["Project at a glance"](#project-at-a-glance) below.

**If you're building it:**
3. [`decisions.md`](./decisions.md) — the resolved choices (MeshJS vs Lucid, demo scenario, etc.).
   Read before writing any code so you're not blocked.
3a. [`cardano-tools.md`](./cardano-tools.md) — **which Cardano tools we use and why** (Aiken, Lucid
   Evolution, Blockfrost, Yaci DevKit, Koios, debugging tools), with the naming caveat between
   `@lucid-evolution/lucid` and the newer `@evolution-sdk/*`.
4. [`architecture.md`](./architecture.md) — how the pieces fit, data flow, component contracts.
5. [`onchain-spec.md`](./onchain-spec.md) — the Aiken validator, in current syntax.
6. [`offchain-spec.md`](./offchain-spec.md) — the four off-chain components, with algorithms and types.
6a. [`frontend.md`](./frontend.md) — the **frontend architecture**: Next.js + Tailwind + Zustand, the
   folder structure, component tree, state model, and extension points.
7. [`fee-economics.md`](./fee-economics.md) — the numbers behind the "fees saved" pitch.
8. [`demo-and-testing.md`](./demo-and-testing.md) — what to build for the demo and how to test it.
9. [`roadmap.md`](./roadmap.md) — milestones and task ownership.

**If you're pitching / presenting it:**
10. [`pitch-and-risks.md`](./pitch-and-risks.md) — positioning, the moat, honest risk answers, Q&A prep.
11. [`pitch-deck.html`](./pitch-deck.html) — the built slide deck (9 slides, real numbers; open in a browser).
12. [`runbook.md`](./runbook.md) — demo-day: setup, the exact click-path, recording, fallback ladder, Q&A.

The original brief is preserved unchanged at [`Projectidea.md`](./Projectidea.md). Where these docs
go deeper or correct it (e.g. Aiken syntax has moved past the brief's `ScriptContext` example),
**these docs win** and say so explicitly.

---

## Project at a glance

### The problem in three sentences
Cardano uses the **eUTXO** model: a given UTXO (think of it as a specific coin) can be spent by
**only one transaction at a time**. When many users hit the same contract at once, their
transactions collide over the same UTXO and **fail on-chain** (and can still cost fees), instead of
running in parallel like on account-based chains. Every serious protocol (Minswap, SundaeSwap)
independently builds a static, rule-based off-chain "batcher" to work around this — there is no
shared, adaptive layer.

### What we build
An off-chain agent (TypeScript) with three cooperating brains plus one pair of hands, feeding an
on-chain Aiken validator:

| Component | Role | "In plain words" |
|---|---|---|
| **Conflict Detector** | Builds a contention graph of pending requests | Draws a map of who clashes with whom |
| **Congestion Predictor** | Emits a live congestion score in `[0,1]` (EWMA of block fullness) | Measures how busy the roads are right now |
| **Batch Optimizer** | Max-independent-set on the graph + timing from the score | Picks the biggest safe group and the right moment to fire |
| **Tx Builder** | Wraps MeshJS/Lucid: build → sign → submit → confirm | The hands that actually put the batch on-chain |
| **`batch_settlement.ak`** | Aiken validator that authorizes a whole batch in one spend | The bouncer checking the batch is legit |

### Data flow
```
User requests (claims / swaps)
        │
        ▼
  Off-chain agent
   ├─ Conflict Detector    ──▶ contention graph
   ├─ Congestion Predictor ──▶ congestion score (0–1)
   └─ Batch Optimizer      ──▶ selected batch + timing
        │
        ▼
  Tx Builder ──▶ ONE settlement transaction
        │
        ▼
  Aiken validator on Cardano L1 (Preprod)
```

### The quantifiable hook
Cardano's fee is `a·size + b` where `b = 0.155381 ADA` is paid **once per transaction, not per user**.
Ten separate txs pay `b` ten times; one batched tx pays it once. The demo pulls **real fee numbers
from Blockfrost** for the naive vs batched paths and shows a live **"fees saved" counter** — a number
judges can verify. See [`fee-economics.md`](./fee-economics.md).

### What this is NOT
Not an AI breakthrough (it's graph theory + a moving average), not a base-layer scaling upgrade
(that's Leios), not a consumer app (it's infrastructure, like ERC-4337 bundlers or CoW solvers).
See [`pitch-and-risks.md`](./pitch-and-risks.md).

---

## Current status

**Design-complete, zero code written.** The repository contains only these docs. The next action is
scaffolding the repo structure (see [`roadmap.md`](./roadmap.md) Milestone 0) after confirming the
decisions in [`decisions.md`](./decisions.md).

## Tech stack (summary)

| Layer | Choice |
|---|---|
| On-chain validator | **Aiken** → compiles to `plutus.json` (CIP-0057 blueprint) |
| Off-chain tx building | **Lucid Evolution** (`@lucid-evolution/lucid`, Anastasia Labs) — ADR-001. Not the newer `@evolution-sdk/*`. |
| Chain data / submit | **Blockfrost** primary; **Koios** keyless backup; **Maestro** for the mempool stretch (ADR-008) |
| Dev network | **Yaci DevKit** (local devnet, instant blocks) to iterate; **Preprod** for the final public settlement (ADR-007) |
| Network | **Cardano Preprod testnet** (free faucet ADA) |
| Tooling reference | [`cardano-tools.md`](./cardano-tools.md) — full use/optional/out-of-scope map |
| Wallets | **Eternl** (primary) / **Lace** (backup) — any CIP-30 wallet, auto-detected |
| Congestion model | **EWMA** of block fullness (a trained model is a stretch goal, not MVP) |
| Frontend | **Next.js (App Router) + TS + Tailwind + Zustand** (+ react-force-graph-2d, Recharts) — see [`frontend.md`](./frontend.md) (ADR-009) |
