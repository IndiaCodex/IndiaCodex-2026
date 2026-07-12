# Adaptive Concurrency-Aware Batcher for Cardano

**Event:** Cardano IndiaCodex'26 Hackathon, Hyderabad
**Track:** General Track — Built on Cardano
**Prizes targeted:** 🥇 ₳1,500 · 🥈 ₳1,000 · 🥉 ₳500 (+ potential Community Choice / Catalyst mentorship path)

This document is a complete build brief. It is written to be handed to an engineering agent (Claude Code) or a dev team with zero additional context needed to start scaffolding the project.

---

## 1. Problem statement

Cardano uses the Extended UTXO (eUTXO) model instead of an account-based model like Ethereum or Solana. Under eUTXO, **a given UTXO can only be spent by one transaction at a time.** When many users try to interact with the same smart contract simultaneously — swapping on a DEX, claiming a limited-supply item, borrowing from a lending pool — their transactions collide over the same UTXO and fail on-chain, rather than executing in parallel the way they would on an account-based chain.

This is the single most-cited technical limitation of building on Cardano. It forces every serious protocol to solve the same problem independently: Minswap, SundaeSwap, and others have each built bespoke, largely static, rule-based off-chain "batcher" services that collect pending user requests and bundle non-conflicting ones into a single settlement transaction. There is no shared, reusable, adaptive infrastructure layer for this — every team reinvents it, and the existing solutions don't adapt to real-time network conditions (they either batch too conservatively when the network is quiet, wasting throughput, or batch poorly when congested, causing failed or overpriced transactions).

**The gap this project fills:** reusable, adaptive infrastructure that any Cardano dApp can plug into instead of building its own batcher from scratch.

---

## 2. Solution overview

**Adaptive Concurrency-Aware Batcher** — an off-chain agent + on-chain settlement validator, with three cooperating off-chain components:

1. **Conflict Detector** — watches incoming user requests before submission and builds a contention graph (which pending requests would try to spend the same UTXO or touch the same contract state). Resolves collisions off-chain before they ever hit the ledger and fail.
2. **Congestion Predictor** — reads recent block fullness, mempool size, and transaction volume trends to produce a live congestion score (0–1). Feeds the batching policy: high congestion → wait longer, build bigger batches, submit fewer larger transactions; low congestion → clear small batches fast for lower latency.
3. **Batch Optimizer** — combines the conflict graph and the congestion score to select the largest set of non-conflicting requests and decide batch timing, then triggers settlement.

All approved requests in a batch settle in **one transaction** against an Aiken validator on Cardano L1.

### Data flow (text version of the architecture diagram already shared in chat)

```
User requests (swaps / claims / etc.)
        |
        v
  Off-chain agent
   |-- Conflict Detector   -> contention graph
   |-- Congestion Predictor -> congestion score (0-1)
   +-- Batch Optimizer     -> selects batch + timing
        |
        v
  Settlement transaction
        |
        v
  Aiken validator on Cardano L1 (Preprod testnet for hackathon)
```

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| On-chain validator language | **Aiken** | Modern, Rust/Elm-like syntax, compiles to UPLC. Recommended over Plutus/Haskell for dev speed. |
| Off-chain transaction building | **MeshJS** or **Lucid Evolution** (TypeScript) | Either works; MeshJS has more turnkey React components, Lucid Evolution is slightly lower-level. Pick one and commit — don't mix. |
| Chain data / indexing | **Blockfrost API** (free tier, Preprod project) | Used for UTXO queries, mempool/block data for the congestion predictor, and tx submission. |
| Network | **Cardano Preprod testnet** | Free test ADA via the official Cardano faucet. No real funds at risk. |
| Wallets (dev/demo) | **Eternl** (primary), **Lace** (backup) | Both CIP-30 compliant, both well-supported on Preprod, both support setting "collateral" required for smart contract calls. Do not build wallet-specific logic — MeshJS/Lucid auto-detect any CIP-30 wallet. |
| Congestion prediction model | Lightweight regression / EWMA (exponentially weighted moving average) on block fullness | Do not overbuild — this is not the core value proposition. A trained model on historical Blockfrost data is a stretch goal, not an MVP requirement. |
| Frontend for demo | Simple Next.js or plain HTML/TS app | Needs to visibly show: incoming requests, congestion score changing live, batch composition, and "before vs after" transaction counts / fees. |

---

## 4. Repository structure (proposed)

```
adaptive-batcher/
├── on-chain/
│   ├── aiken.toml
│   ├── validators/
│   │   └── batch_settlement.ak
│   └── lib/
│       └── types.ak
├── off-chain/
│   ├── src/
│   │   ├── conflictDetector.ts
│   │   ├── congestionPredictor.ts
│   │   ├── batchOptimizer.ts
│   │   ├── txBuilder.ts        (wraps MeshJS/Lucid calls)
│   │   └── blockfrostClient.ts
│   └── package.json
├── demo-app/
│   ├── src/                    (Next.js frontend)
│   └── package.json
└── README.md
```

---

## 5. On-chain component: Aiken validator spec

**Purpose:** validate that a settlement transaction correctly processes a batch of user-approved requests (e.g., claims or swaps) in one spend, splitting state across multiple output UTXOs to preserve future concurrency (per the eUTXO best practice of not concentrating state in a single UTXO).

### Datum
```aiken
pub type BatchDatum {
  owner: VerificationKeyHash,   // who can claim / trade this UTXO's contents
  item_id: ByteArray,           // e.g. ticket ID, order ID
  status: Status,               // Open | Claimed
}

pub type Status {
  Open
  Claimed
}
```

### Redeemer
```aiken
pub type BatchRedeemer {
  claims: List<ClaimEntry>,     // the batch: which requests are being settled together
}

pub type ClaimEntry {
  utxo_ref: OutputReference,
  claimant: VerificationKeyHash,
}
```

### Validator logic (spend handler) — required checks
1. Every `ClaimEntry` in the redeemer corresponds to a real UTXO input in this transaction.
2. Each claimed UTXO's datum has `status == Open`.
3. The transaction is signed by (or otherwise authorizes) each `claimant` listed.
4. No UTXO appears twice in the batch (prevents double-claim within one settlement).
5. Output UTXOs correctly mark claimed items as `Claimed` (or send them to the claimant, depending on demo semantics — decide during scaffolding whether this is a "claim" pattern or a "swap" pattern; see Section 7 for the recommended demo scenario).
6. State remains split across multiple UTXOs after settlement (do not collapse into one giant output) — this preserves the ability for the *next* batch to process concurrently.

**Testing:** use `aiken check` continuously during development — it runs the validator on the actual on-chain VM and reports CPU/memory cost, which doubles as a benchmark for how large a batch can be before hitting execution unit limits.

### Build & get script address
```
aiken build
```
Produces `plutus.json` (CIP-0057 blueprint) containing the compiled validator and its hash — this hash becomes the script address. There is no separate "deploy" transaction; the first transaction that sends funds to the script address is effectively the deployment.

### Reference script (do this once stable)
Publish the compiled validator as a reference script in one dedicated UTXO. Future settlement transactions point to that UTXO instead of re-embedding the full script bytecode, which meaningfully reduces per-transaction fees — this is standard practice for any protocol beyond a toy demo and directly supports the fee-savings pitch (Section 8).

---

## 6. Off-chain components: detailed specs

### 6.1 Conflict Detector
- **Input:** list of pending user requests (each references a target UTXO or contract state region).
- **Process:** build a graph where nodes = pending requests, edges = "these two requests would spend the same UTXO or touch the same state."
- **Output:** contention graph, passed to the Batch Optimizer.
- **Implementation note:** this is a standard graph-construction problem — no need to invent new theory here. Poll pending requests via a local queue (websocket/API from the demo frontend) rather than watching the real Cardano mempool for the MVP (watching the actual mempool for Cardano-specific conflicts is a stretch goal; Blockfrost doesn't provide raw mempool access on all tiers — check current API docs before committing to this for the MVP).

### 6.2 Congestion Predictor
- **Input:** recent block fullness (last N blocks), mempool size if available, time-of-day trend.
- **Process:** compute a congestion score in [0, 1]. MVP: simple weighted average or EWMA of recent block fullness pulled from Blockfrost's block endpoints. Stretch: small trained model on historical epoch data.
- **Output:** congestion score, passed to the Batch Optimizer to set batch window size (e.g., score > 0.7 → wait up to 60s and batch aggressively; score < 0.3 → clear every 5–10s).

### 6.3 Batch Optimizer
- **Input:** contention graph (from 6.1) + congestion score (from 6.2).
- **Process:** solve for the largest set of non-conflicting requests (max independent set on the contention graph — well-studied, use an existing graph library rather than writing this from scratch), then decide batch timing based on the congestion score.
- **Output:** a finalized batch → passed to the tx builder to construct and submit the settlement transaction referencing the Aiken validator.

### 6.4 Tx Builder
- Wraps MeshJS or Lucid Evolution calls.
- Responsible for: fetching relevant UTXOs, constructing the batch redeemer, attaching (or referencing) the compiled script, signing via connected wallet, submitting via Blockfrost, and awaiting confirmation.

---

## 7. Demo application (recommended scenario)

**Recommendation: a "limited-drop ticket claim" app.** Simpler to build well in the hackathon's timeframe than a full order-book DEX, and the concurrency problem is immediately visible to judges: many people trying to claim the same limited pool of tickets at once.

- Seed N ticket UTXOs at the script address (e.g., N = 20).
- Simulate 30–50 concurrent claim requests (a simple load-generation script, not real distinct users needed).
- **Naive path (for comparison):** show these submitted as individual transactions — many fail/queue due to UTXO contention.
- **Batcher path:** show the same load going through the Conflict Detector → Congestion Predictor → Batch Optimizer pipeline, settling in a handful of transactions with the congestion score visibly changing batch size live on screen.

**Stretch alternative:** a mini order-book DEX (buy/sell requests batched into one settlement) — more impressive but meaningfully more on-chain logic to get right in the time available. Only attempt if the ticket-claim MVP is done early.

---

## 8. Fee economics (for the pitch and the live demo)

Cardano's minimum fee formula:
```
base_fee = a * size(tx_bytes) + b
```
Current approximate parameters: `a ≈ 0.000044 ADA/byte`, `b ≈ 0.155381 ADA`. Smart contract transactions add script execution cost (`priceSteps * steps + priceMemory * memory`) on top.

**The core value-prop calculation:** `b` is paid once per transaction, not once per operation. If 10 users submit 10 separate transactions, `b` is paid 10 times. If the batcher settles all 10 in one transaction, `b` is paid once — only the marginal `a * size` and script cost for the extra data scale with batch size, which is far cheaper than 10 full separate transactions.

```
10 separate txs  ≈ 10 * (a*size + b + script_fee)
1 batched tx     ≈ a*(bigger size) + b (once) + script_fee (once, for batch logic)
```

**For the demo:** pull real fee numbers from Blockfrost for both the naive and batched paths and display a live "fees saved" counter. This is a concrete, quantifiable number judges can verify, not a vague "AI makes it more efficient" claim.

---

## 9. Pitch positioning

- **What it is:** infrastructure, not a single consumer app — the same category as ERC-4337 bundlers on Ethereum or CoW Protocol's solver network, applied to a chain where it's structurally necessary because of eUTXO contention.
- **What it is not:** a novel ML breakthrough. Conflict detection is graph theory, congestion prediction is time-series forecasting. Don't oversell "AI" — the real value is reusable infrastructure + adaptive policy, not the algorithms themselves.
- **The moat (say this explicitly in the pitch):** trusted, reliable infrastructure other dApps plug into instead of building their own batcher, plus a network-effect flywheel — the more dApps route through it, the better its view of real contention patterns.
- **Known risks to address proactively, not hide:** small current TAM (~$130M Cardano DeFi TVL), possible reduced need over time as base-layer scaling (Leios) improves, and centralization/front-running risk inherent to any batcher role (address with a proposed answer: staked/slashed batcher operators or a competitive solver auction model, even if not implemented in the hackathon version — just say it's the next step).
- **Funding path:** this fits Project Catalyst's funding criteria (ecosystem infrastructure) better than a single-purpose app — worth stating directly: "this is a 48-hour proof of concept for infrastructure the whole Cardano DeFi ecosystem needs."

---

## 10. Suggested build order / milestones (10-day window, 1 offline day in Hyderabad)

1. **Day 1 (offline, team formation day):** finalize demo scenario (ticket-claim vs DEX), assign on-chain vs off-chain ownership, scaffold repo structure.
2. **Days 2–3:** Aiken validator — datum/redeemer types, spend logic, passing `aiken check` tests. Get a basic lock/unlock transaction working end-to-end on Preprod via MeshJS/Lucid before adding batch logic.
3. **Days 4–5:** Conflict Detector + Batch Optimizer (off-chain, no chain interaction needed yet — test with mocked request data).
4. **Day 6:** Congestion Predictor (Blockfrost integration, EWMA calculation).
5. **Day 7:** Wire everything together — full pipeline from simulated user requests to a real batched settlement transaction on Preprod.
6. **Day 8:** Demo frontend — visualize requests coming in, congestion score, batch composition, before/after fee comparison.
7. **Day 9:** Polish, load-test with 30–50 simulated concurrent requests, fix edge cases (failed batches, wallet collateral issues).
8. **Day 10:** Pitch deck, rehearse demo script, prepare for Q&A on the risks in Section 9.

---

## 11. Open decisions to make before/while coding

- MeshJS vs Lucid Evolution (pick one, don't mix).
- Ticket-claim demo vs mini-DEX demo (recommend ticket-claim per Section 7).
- Whether to attempt real mempool-based conflict detection or a simulated-queue MVP (recommend simulated queue for time budget).
- Whether to implement the reference-script optimization within the hackathon window or mention it as a stated next step in the pitch (either is fine — implementing it is a stronger demo but not required to make the pitch credible).

---

## 12. Non-goals (explicitly out of scope for this project)

- This project does **not** attempt to change Cardano's base-layer consensus throughput. That is what Leios (Cardano's in-progress base-layer scaling upgrade) is for. This project solves *effective* throughput at the application/infrastructure layer, and the pitch should be explicit about that distinction — it's a sign of technical maturity, not a weakness.
- No zero-knowledge/privacy features (that would be Midnight track scope, not this project as currently scoped).
- No AI-agent-to-agent monetization (that would be Masumi track scope; see the separate discussion on whether a second demo variant is worth building as a stretch goal).