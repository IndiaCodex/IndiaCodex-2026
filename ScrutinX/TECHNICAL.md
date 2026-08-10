# Adaptive Concurrency-Aware Batcher for Cardano

> **Reusable, adaptive batching infrastructure for Cardano — the shared layer every eUTXO dApp needs but currently rebuilds from scratch.**
> It detects which pending user requests collide over the same UTXO, reads live network congestion, and settles the largest non-conflicting set in **one on-chain transaction** — cutting failed transactions and fees.

**Event:** Cardano **IndiaCodex'26 Hackathon** (Hyderabad) · **Track:** General — *Built on Cardano* · **Network:** Preprod testnet (test ADA only)

---

## Table of contents

1. [The problem](#1-the-problem)
2. [The solution](#2-the-solution)
3. [How it works — the batching pipeline](#3-how-it-works--the-batching-pipeline)
4. [Why the on-chain part matters (the state-splitting invariant)](#4-why-the-on-chain-part-matters-the-state-splitting-invariant)
5. [Architecture & repository layout](#5-architecture--repository-layout)
6. [Tech stack](#6-tech-stack)
7. [Quick start — run the demo (no chain, no keys)](#7-quick-start--run-the-demo-no-chain-no-keys)
8. [Go on-chain (Preprod)](#8-go-on-chain-preprod)
9. [The four off-chain components in detail](#9-the-four-off-chain-components-in-detail)
10. [The Aiken validator in detail](#10-the-aiken-validator-in-detail)
11. [Fee economics — the quantifiable proof](#11-fee-economics--the-quantifiable-proof)
12. [Configuration & environment variables](#12-configuration--environment-variables)
13. [Testing](#13-testing)
14. [Security model](#14-security-model)
15. [Positioning, moat & risks](#15-positioning-moat--risks)
16. [Scope, non-goals & roadmap](#16-scope-non-goals--roadmap)
17. [Further documentation](#17-further-documentation)

---

## 1. The problem

Cardano uses the **Extended UTXO (eUTXO)** model instead of an account-based model like Ethereum or Solana. Under eUTXO, **a given UTXO can only be spent by one transaction at a time.**

When many users try to interact with the *same* smart-contract state simultaneously — swapping on a DEX, claiming a limited-supply item, borrowing from a lending pool — their transactions **collide over the same UTXO and fail on-chain**, instead of executing in parallel the way they would on an account-based chain.

This is the single most-cited technical limitation of building on Cardano. It forces every serious protocol to solve the same problem independently: Minswap, SundaeSwap, and others have each built bespoke, largely **static**, rule-based off-chain *"batcher"* services that collect pending user requests and bundle non-conflicting ones into a single settlement transaction.

There is **no shared, reusable, adaptive infrastructure layer** for this:

- Every team reinvents its own batcher from scratch.
- Existing solutions don't adapt to real-time network conditions — they either batch **too conservatively** when the network is quiet (wasting throughput / adding latency), or batch **poorly** when congested (causing failed or overpriced transactions).

**The gap this project fills:** reusable, adaptive infrastructure that any Cardano dApp can plug into instead of building its own batcher.

---

## 2. The solution

An **off-chain agent** + an **on-chain Aiken settlement validator**, working together. The agent has three cooperating components feeding a settlement step:

1. **Conflict Detector** — watches incoming user requests *before* submission and builds a **contention graph** (which pending requests would try to spend the same UTXO or touch the same state). Resolves collisions off-chain before they ever hit the ledger and fail.
2. **Congestion Predictor** — reads recent block fullness from live chain data and produces a **congestion score in `[0, 1]`** via an EWMA (exponentially weighted moving average). Feeds the batching policy: **high congestion → wait longer, build bigger batches; low congestion → clear small batches fast** for lower latency.
3. **Batch Optimizer** — combines the conflict graph and the congestion score to select the **largest set of non-conflicting requests** (a Maximum Independent Set on the contention graph) and decide batch timing, then triggers settlement.

All approved requests in a batch settle in **one transaction** against the Aiken validator on Cardano L1.

> **Honesty note (important to the pitch):** this is **not an AI/ML breakthrough.** Conflict detection is **graph theory**; congestion prediction is a **moving average**. There is no trained model in the MVP and the pitch does not claim one. The value is **reusable adaptive infrastructure + adaptive policy**, not the algorithms themselves.

---

## 3. How it works — the batching pipeline

A *"batch cycle"* is one iteration of the optimizer's loop. End-to-end, a single cycle looks like this:

```
 1. Users submit requests ──▶ appended to the Request Queue (in-memory, ordered by arrival).
 2. Congestion Predictor (own timer) maintains a current score S ∈ [0,1] via EWMA of block fullness.
 3. Optimizer wakes on its batch window. Window length is a function of S:
        S high  ▶ long window  (up to 60s) — gather more before firing.
        S low   ▶ short window (~7s)       — fire fast for low latency.
 4. Conflict Detector takes the queued requests ──▶ builds contention graph G (edge = same UTXO).
 5. Optimizer solves Maximum Independent Set on G ──▶ largest conflict-free subset B (capped at N_max).
        (Requests not in B stay queued for the next cycle — they weren't rejected, just deferred.)
 6. Settlement:
        a. fetch the live UTXOs referenced by B
        b. build the batch redeemer (list of ClaimEntry)
        c. attach/reference the compiled validator
        d. sign server-side with the seed wallet
        e. submit via Blockfrost, await confirmation
 7. On success: mark requests settled, emit a "settled" event to the UI with REAL fee data.
        On failure: drop the offending request back to the queue, retry the rest next cycle.
 8. Loop.
```

The **adaptive** part is entirely in steps 2–3: the *same* pipeline behaves differently under load because the congestion score reshapes the window (and therefore the batch size). That the loop is identical regardless of load is exactly what makes "the policy is real" true.

---

## 4. Why the on-chain part matters (the state-splitting invariant)

The clever orchestration is off-chain, so a fair judge asks: *"is this even a Cardano project, or just a script?"* The answer is the **validator**, and specifically **one rule** it enforces:

> **After a settlement, state STAYS SPLIT** — the number of continuing script outputs must be **≥ the number of claims** in the batch. State is **never collapsed** into a single UTXO.

Why this is non-negotiable: if a settlement collapsed N tickets into one output, the *next* batch would all collide on that single UTXO — **re-creating the exact eUTXO contention the project exists to remove**, one block later. This is the rule Cardano-literate judges look for.

The mental model:

- **The batcher removes contention *within* a batch.**
- **State-splitting preserves the absence of contention *across* batches.**

Both are required; either alone is insufficient. The validator is the **trust anchor** that makes the off-chain agent *safe* to rely on — it enforces batch correctness (only `Open` tickets, authorized claimants, no double-claims) and the state-splitting invariant.

---

## 5. Architecture & repository layout

```
┌──────────────┐      requests        ┌───────────────────────────────────────────┐
│  Demo app /  │  ───────────────────▶│              OFF-CHAIN AGENT                │
│ load-gen     │                      │  ┌───────────────┐   ┌────────────────────┐│
│ (browser)    │◀───────────────────  │  │ Request Queue │──▶│ Conflict Detector  ││
└──────────────┘   live state         │  └───────────────┘   └─────────┬──────────┘│
                                      │          ▲                     │ graph      │
                                      │  ┌───────┴───────┐   ┌─────────▼──────────┐ │
                                      │  │  Congestion   │──▶│  Batch Optimizer   │ │
                                      │  │  Predictor    │   │  (MIS + timing)    │ │
                                      │  └───────▲───────┘   └─────────┬──────────┘ │
                                      │          │           ┌─────────▼──────────┐ │
                                      │          │           │  Settlement (Lucid)│ │
                                      └──────────┼───────────┴─────────┬──────────┘─┘
                                                 │ block data          │ submit tx
                                                 ▼                     ▼
                                      ┌─────────────────────────────────────────────┐
                                      │              BLOCKFROST (Preprod)            │
                                      └───────────────────────┬─────────────────────┘
                                                              ▼
                                      ┌─────────────────────────────────────────────┐
                                      │  Cardano Preprod L1  ── batch_settlement.ak  │
                                      └─────────────────────────────────────────────┘
```

**Repository layout:**

```
Cardano-hackathon/
├── AGENT.md            # binding operating guide for anyone (human/AI) writing code here — read first
├── README.md           # this file
├── Docs/               # all specs & plans (the authoritative source of truth)
│   ├── Projectidea.md      #   the full build brief
│   ├── architecture.md     #   system shape, component contracts, failure handling
│   ├── 6hr-sprint.md       #   the governing timed plan + fallback ladder
│   ├── offchain-spec.md    #   the agent modules
│   ├── onchain-spec.md     #   the validator (full 6-rule spec)
│   ├── fee-economics.md    #   the "fees saved" math + N_max
│   ├── frontend.md         #   frontend architecture
│   ├── cardano-tools.md    #   which Cardano tools we use & why
│   ├── pitch-and-risks.md  #   positioning, moat, risks, Q&A prep
│   ├── decisions.md        #   ADRs (architecture decision records)
│   └── glossary.md         #   vocabulary
│
├── on-chain/           # Aiken validator
│   ├── aiken.toml          #   project + pinned stdlib (aiken v1.1.23, plutus v3, stdlib v3.1.0)
│   ├── validators/
│   │   └── batch_settlement.ak   #   the spend validator + full test suite
│   ├── lib/batcher/types.ak      #   BatchDatum / BatchRedeemer / ClaimEntry / Status
│   └── plutus.json         #   compiled CIP-0057 blueprint (produced by `aiken build`)
│
├── off-chain/          # reference off-chain modules — the canonical spec of the agent logic
│   └── src/                #   conflictDetector, congestion, optimizer, settlement, types, ...
│
└── demo-app/           # the runnable Next.js app (UI + API routes + a running copy of the agent)
    ├── app/                #   App Router pages + API routes (/api/settle, /api/tickets, /api/congestion)
    ├── components/         #   presentational React components (graph, gauge, panels, fees, ...)
    ├── lib/agent/          #   the live agent copy (config, conflictDetector, congestion, optimizer, settlement)
    ├── lib/engine/         #   load generator + graph adapter + integration tests
    ├── hooks/ · stores/    #   React hooks + Zustand store
    └── scripts/            #   seed.ts / claim.ts / batch.ts (on-chain CLI helpers)
```

Three deployable units: **`on-chain/`** (the validator, the face's trust anchor), **`off-chain/`** (the reference agent logic, the brain), and **`demo-app/`** (the runnable Next.js app that hosts both the UI and a live copy of the agent behind API routes).

---

## 6. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| **On-chain validator** | **Aiken** (`plutus v3`) | Modern Rust/Elm-like syntax, compiles to UPLC. Current `validator {}` block syntax (`spend(datum, redeemer, own_ref, self)`), not the old `ScriptContext`. Pinned: aiken `v1.1.23`, stdlib `v3.1.0`. |
| **Off-chain tx building** | **Lucid Evolution** (`@lucid-evolution/lucid` by Anastasia Labs) | ADR-001: this package, **not** the newer `@evolution-sdk/*`. TypeScript, strict. |
| **Chain data / indexing / submit** | **Blockfrost API** (Preprod) | UTXO queries, block/protocol-param reads for the congestion predictor, and tx submission. URL is env-driven so the same client also works against **Yaci DevKit** (local devnet, no key) or **Koios** (keyless backup) with no code change. |
| **Network** | **Cardano Preprod testnet** | Free test ADA via the official faucet. No real funds at risk, ever. Provider pinned to `"Preprod"`. |
| **Congestion model** | **EWMA** of block fullness | Deliberately not ML. A trained model is a stated stretch goal, not MVP. |
| **Frontend** | **Next.js (App Router) + TypeScript** | + **Tailwind** (styling), **Zustand** (state), **Recharts** (charts). Simulation runs client-side; the single server route `/api/settle` does the real tx. |

---

## 7. Quick start — run the demo (no chain, no keys)

The app defaults to **demo mode** and runs with **zero chain access** — no Blockfrost key, no wallet, nothing to fund.

```bash
cd demo-app
npm install
npm run dev          # open http://localhost:3000
```

Then, in the UI:

- Click a **load preset** (*Heavy contention* / *Spread* / *Mixed*) to fire a simulated claim rush.
- Drag the **congestion slider** — a clearly-labeled manual injection (Preprod is idle, so this demonstrates the adaptive policy).
- Watch the **contention graph**, **batch composition**, the **live congestion gauge/sparkline**, and the **fees-saved counter** update in real time.
- Compare the **Naive panel** (N separate txs, many colliding) against the **Batcher panel** (one settlement).

Everything is computed from live protocol-parameter fallbacks and the real EWMA/policy — only the *chain submit* is simulated in demo mode.

---

## 8. Go on-chain (Preprod)

To make settlement a **real Preprod transaction** (with a Cardanoscan link):

1. **Build the validator:**
   ```bash
   cd on-chain
   aiken build          # produces plutus.json (CIP-0057 blueprint)
   aiken check          # run the validator test suite + read CPU/mem cost per batch size
   ```
2. **Configure secrets:** copy `demo-app/.env.example` → `demo-app/.env.local` and fill in:
   - `BLOCKFROST_PROJECT_ID` — a Blockfrost **Preprod** project key.
   - `WALLET_SEED` — a funded 24-word Preprod mnemonic (fund it from the official faucet). **Server-side only.**
   - `SCRIPT_ADDRESS` — the validator's address (from the compiled `plutus.json`).
   - For a faster loop, point `BLOCKFROST_URL` at a local **Yaci DevKit** devnet (Blockfrost-compatible, no key, instant blocks — see `Docs/cardano-tools.md`).
3. **Seed ticket UTXOs** at the script address (e.g. N = 20, each a distinct UTXO — never one UTXO holding N tickets):
   ```bash
   cd demo-app
   npm run seed
   ```
4. **Settle for real:** set `SETTLEMENT_MODE=real` (and/or `CONGESTION_MODE=real`) and fire a claim rush. The `/api/settle` route builds, signs (server-side), and submits **one batched settlement transaction**; the UI shows the **Cardanoscan** link and the real fee.

CLI helpers are also available for scripted runs: `npm run claim` (single claim) and `npm run batch` (a batched settlement) — both read `.env.local`.

---

## 9. The four off-chain components in detail

All four live in `demo-app/lib/agent/` (with a mirrored reference copy in `off-chain/src/`). The **Conflict Detector** and **Batch Optimizer** are **pure functions** — no I/O, no `Date.now()`/`Math.random()` in reproducible logic — which is why they're trivially unit-testable with mocked graphs.

### 9.1 Conflict Detector — `conflictDetector.ts`
- **Input:** the current request queue (`UserRequest[]`).
- **Rule (MVP):** two requests conflict **iff they target the same UTXO** (`a.targetUtxoRef === b.targetUtxoRef`). The rule is a single pluggable function, so it extends to DEX/shared-state conflicts later.
- **Process:** groups requests by target (O(n) common case rather than O(n²) pairwise), emits edges between same-target requests, and builds an adjacency map.
- **Output:** a `ContentionGraph { nodes, edges, adjacency }`.

### 9.2 Congestion Predictor — `congestion.ts`
- **Input:** recent block fullness from Blockfrost (`block.size / maxBlockSize`), sampled on a timer.
- **Process:** an **EWMA** — `score = α · target + (1 − α) · score` (`α = 0.4`, clamped to `[0,1]`). The real reading is refreshed ~every 20s (Cardano block cadence); the EWMA ticks every 1.5s so the slider feels live.
- **Manual injection:** on an idle testnet the real reading sits near 0, so an optional slider **overrides the input** to demonstrate the policy. This is clearly a demonstration aid — the EWMA and policy are always real.
- **Output → policy:** `windowMs()` maps the score to a batch window:
  - `score ≥ 0.7` → **congested** → `60s` window (batch big).
  - `score ≤ 0.3` → **quiet** → `7s` window (clear fast).
  - in between → **linear interpolation** between the two.

### 9.3 Batch Optimizer — `optimizer.ts`
- **Input:** the contention graph + the congestion score + the batch cap.
- **Process:** greedy **Maximum Independent Set** (min-degree heuristic) — repeatedly take the request with the *fewest remaining conflicts*, then remove it and its neighbours. Good enough for the small, sparse graphs here and easy to explain to judges.
- **Cap:** the chosen set is capped at `batchCap` (the measured on-chain execution limit — see §11).
- **Output:** a `Batch { requests, builtAtScore }` — the largest conflict-free subset that will fit in one tx.

### 9.4 Settlement — `settlement.ts`
Single entry point `settleBatch(batch)` picks its path from the `settlementMode` toggle:
- **`demo`** — computes a realistic *simulated* `SettlementResult` from live protocol params (or fallbacks: `minFeeA = 44`, `minFeeB = 155381`). No chain call. Uses a deterministic fake hash (seeded from request IDs, so no `Math.random`).
- **`real`** — builds, signs, and submits a real Preprod batch tx via **Lucid Evolution** + the seed wallet, **server-side only**:
  - Loads the compiled validator from `plutus.json`.
  - Re-resolves live script UTXOs and settles **only the tickets still present on-chain** (stale-list safe — tickets spent since the client fetched are simply dropped; if none remain it errors clearly rather than faking).
  - Re-pays each claimed ticket back to the script marked `Claimed` — **one output per claim**, so state STAYS SPLIT (validator rule 4/6).
  - Adds the signer key so it lands in `extra_signatories` (validator rule 2).
  - Reads the **real fee** from the built tx (never trusts a client-supplied value) and returns a Cardanoscan `explorerUrl`.

Shared types (`types.ts`) are the single source of truth: `UserRequest`, `ContentionGraph`, `Batch`, `SettlementResult`, `BlockSummary`, `ProtocolParams`.

---

## 10. The Aiken validator in detail

Located at `on-chain/validators/batch_settlement.ak`. It authorizes **one settlement transaction** that claims a whole batch of ticket UTXOs. The spend handler fires **once per script input** in the batch, so every check is written to reach the same verdict regardless of which input triggered evaluation (**order-independent**).

### Datum, redeemer & status (`lib/batcher/types.ak`)

```aiken
pub type Status { Open, Claimed }

pub type BatchDatum {
  owner: VerificationKeyHash,   // who can claim this UTXO's contents
  item_id: ByteArray,           // e.g. ticket ID
  status: Status,               // Open | Claimed
}

pub type ClaimEntry {
  utxo_ref: OutputReference,
  claimant: VerificationKeyHash,
}

pub type BatchRedeemer {
  claims: List<ClaimEntry>,     // the batch: which requests settle together
}
```

### The rules the validator enforces (hackathon set: 4 of the full 6)

1. **This input's datum is `Open`** — and each claimed input across the batch is `Open` (`input_is_open`).
2. **Each claimant signed the tx** — every `claimant` appears in `extra_signatories`.
3. **No UTXO appears twice** in the batch — `no_duplicate_refs` (prevents double-claim within one settlement).
4. **State stays split** — continuing script outputs `>=` number of claims (`state_stays_split`). This is the concurrency invariant from §4.

> The datum/redeemer schemas in `off-chain`/`demo-app` (`Data.Object(...)` in `settlement.ts`) **byte-match** these Aiken types — they must stay in lockstep.

### Testing the validator

Run `aiken check` continuously. The suite exercises the **whole spend handler** with mocked transactions and includes **both accept and reject cases** for every rule (a validator tested only on the happy path will approve a bad batch):

- `accept_valid_batch_of_3` — happy path.
- `reject_when_an_input_is_claimed` — rule 1.
- `reject_missing_signature` — rule 2.
- `reject_duplicate_utxo_ref` — rule 3.
- `reject_collapsed_outputs` — rule 4 (collapsing state must fail).
- `benchmark_batch_4/8/16/24` — `aiken check` reports CPU/mem per test; the largest `n` that stays under `maxTxExUnits` is **N_max**, which sets `batchCap`.

### Build & deploy

`aiken build` produces `plutus.json` (CIP-0057 blueprint) containing the compiled validator and its hash — that hash **is** the script address. There is no separate deploy tx: the first transaction that sends funds to the script address is effectively the deployment.

---

## 11. Fee economics — the quantifiable proof

Cardano's minimum fee formula is `base_fee = a · size(tx_bytes) + b`, where `b` (≈ `0.155381 ADA`, i.e. `minFeeB = 155381` lovelace) is paid **once per transaction**, not once per operation. Smart-contract txs add script execution cost on top.

**The core value calculation:**

```
10 separate txs  ≈ 10 · (a·size + b + script_fee)     ← b paid 10 times
1 batched tx     ≈ a·(bigger size) + b (once) + script_fee (once)   ← b paid ONCE
```

Only the marginal `a·size` and script cost scale with batch size — far cheaper than N full separate transactions.

**Measured on Preprod (real numbers, not estimates):**
- A single real claim tx measured **238,189 lovelace** fee (`config.singleClaimFeeLovelace`).
- Batching **5 claims** in one tx measured **593,035 lovelace** → **~53% saved** vs 5 separate claims.

**Measured `N_max` / `batchCap`:** the spend handler runs once per input, and each run does O(n²) work → real cost ≈ **O(n³)**. Benchmarks: 5 claims confirmed fine; 16 blew the memory budget (failed around input ~7). So real `N_max ≈ 6–7` with this validator, and **`batchCap = 6` is the safe setting**. (A `Dict`-based O(1) lookup optimization would raise this materially — a stated next step.)

The demo surfaces this as a **live "fees saved" counter** driven by real Blockfrost fee data — a number a judge can verify, not an adjective.

---

## 12. Configuration & environment variables

All config is centralized in `demo-app/lib/agent/config.ts` and driven by env (copy `demo-app/.env.example` → `.env.local`). **Never commit `.env*`.**

| Variable | Purpose | Notes |
|---|---|---|
| `CONGESTION_MODE` | `demo` (simulated) or `real` (live Blockfrost) | defaults to `demo` |
| `SETTLEMENT_MODE` | `demo` (simulated result) or `real` (real Preprod tx) | defaults to `demo` |
| `BLOCKFROST_URL` | chain API endpoint | switches between Blockfrost / Yaci / Koios with no code change |
| `BLOCKFROST_PROJECT_ID` | Blockfrost Preprod key | **server-side only**; empty for Yaci |
| `WALLET_SEED` | 24-word Preprod mnemonic | **server-side only**, never shipped to the browser |
| `SCRIPT_ADDRESS` | the deployed validator address | from `plutus.json` |
| `PLUTUS_JSON_PATH` | path to the compiled blueprint | defaults to `../on-chain/plutus.json` |

Key tuned constants (`config.ts`): `ewmaAlpha = 0.4`, `pollIntervalMs = 1500`, policy thresholds `0.3 / 0.7`, windows `7s / 60s`, `batchCap = 6`, `singleClaimFeeLovelace = 238189`.

Money is handled as integer **lovelace** everywhere (1 ADA = 1,000,000 lovelace); ADA is only formatted at the UI edge.

---

## 13. Testing

- **Off-chain unit tests** (Vitest): `cd demo-app && npm run test`. Covers:
  - **Conflict Detector** — mocked requests → exact expected edges (empty graph, complete graph extremes).
  - **Batch Optimizer** — chosen set is conflict-free, within cap, maximal-ish (all-conflict → 1 chosen; no-conflict → all up to cap).
  - **Congestion** — EWMA output on a known sequence; score→window thresholds and clamping to `[0,1]`.
  - **Load generator + integration** — end-to-end pipeline over synthetic request bursts.
- **On-chain tests:** `cd on-chain && aiken check` — one test per validator rule, **including rejection cases**, plus batch-size benchmarks.

---

## 14. Security model

This project deliberately keeps its attack surface small (see `AGENT.md` §4). Key guarantees:

- **Secrets are server-side only.** `WALLET_SEED` and `BLOCKFROST_PROJECT_ID` are read only in server code (API routes / node scripts), never imported into a client component, and `.env*` is gitignored — they never reach the browser bundle.
- **Preprod only, test ADA only.** The Lucid provider is pinned to `"Preprod"`; there is no code path that could target mainnet.
- **`/api/settle` validates its input** before building a real transaction. The client **never** sets a fee or txHash — the server reads the real fee from the built tx.
- **No browser wallet / CIP-30 in the MVP.** Signing is done server-side with the seed wallet; the single demo signer standing in for many users is a **disclosed** simplification (per-user delegated authorization is a stated next step).
- **Stale-list safe.** Real settlement re-resolves live UTXOs and settles only tickets still `Open` on-chain, dropping any spent since the client fetched.

---

## 15. Positioning, moat & risks

**What it is:** *infrastructure*, not a consumer app — the same category as **ERC-4337 bundlers** on Ethereum or **CoW Protocol's solver network**, applied to a chain where it's **structurally necessary** because of eUTXO contention. On account-based chains batching is an optimization; on Cardano an adaptive batcher is a requirement for any high-concurrency dApp.

**The moat (narrative for the pitch; the MVP is single-dApp):**
1. **Trusted shared infrastructure** — once dApps rely on a proven batcher, switching cost and trust become the moat.
2. **Network-effect flywheel** — the more dApps route through it, the better its view of real contention patterns → better decisions → more attractive to the next dApp.

**Risks — named openly (this scores points), each with an answer:**

| Risk | Honest framing | Answer |
|---|---|---|
| Small TAM (~$130M Cardano DeFi TVL) | Modest market today | Infrastructure bets on ecosystem *growth* and reduces a top friction to it; fits Catalyst funding. |
| Leios may reduce the need | Base-layer scaling could ease contention | Leios raises base throughput but doesn't make application-level contention resolution free; complementary, not obsoleted, and not near-term. |
| Centralization / front-running | A batcher is a privileged middleman | Next step: **staked, slashable operators** or a **competitive solver auction** (à la CoW) so the role is punishable and contestable. |
| *"It's just an off-chain script"* | The clever part is off-chain | The validator enforces batch correctness **and** the state-splitting invariant — genuine, non-trivial eUTXO engineering; it's what makes the agent safe to trust. |

---

## 16. Scope, non-goals & roadmap

**Explicit non-goals:**
- Does **not** change Cardano's base-layer consensus throughput — that's **Leios**. This project solves *effective* throughput at the application/infrastructure layer.
- **No** zero-knowledge/privacy features (that's Midnight-track scope).
- **No** agent-to-agent monetization (that's Masumi-track scope).

**Stated next steps (post-hackathon):**
- Staked/slashable batcher operators or a competitive solver-auction model.
- Multi-dApp routing (turning the flywheel from narrative into implementation).
- Per-user delegated authorization (removing the single-signer demo simplification).
- Real-mempool conflict detection (beyond the local request queue).
- The `Dict`-based O(1) validator optimization to raise `N_max` materially.
- Reference-script publication to cut per-tx fees further.
- Persistence so the request queue survives an agent restart.

---

## 17. Further documentation

The `Docs/` directory is the authoritative source of truth. Start here:

- **[`AGENT.md`](AGENT.md)** — binding operating guide (read before writing any code).
- **[`Docs/Projectidea.md`](Docs/Projectidea.md)** — the complete build brief.
- **[`Docs/architecture.md`](Docs/architecture.md)** — system shape, component contracts, failure handling.
- **[`Docs/onchain-spec.md`](Docs/onchain-spec.md)** · **[`Docs/offchain-spec.md`](Docs/offchain-spec.md)** — the validator & agent specs.
- **[`Docs/fee-economics.md`](Docs/fee-economics.md)** — the fees-saved math and `N_max`.
- **[`Docs/pitch-and-risks.md`](Docs/pitch-and-risks.md)** — positioning, moat, risks, and Q&A prep.
- **[`Docs/cardano-tools.md`](Docs/cardano-tools.md)** · **[`Docs/decisions.md`](Docs/decisions.md)** · **[`Docs/glossary.md`](Docs/glossary.md)**.

---

*Built for the Cardano IndiaCodex'26 Hackathon · Preprod testnet · test ADA only.*
