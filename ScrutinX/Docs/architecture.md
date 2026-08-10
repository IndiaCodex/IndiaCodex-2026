# Architecture

How the pieces fit together, what data crosses each boundary, and the contracts between components.
Read [`glossary.md`](./glossary.md) first if any term is unfamiliar.

---

## 1. System context (who talks to whom)

```
┌──────────────┐      requests        ┌───────────────────────────────────────────┐
│  Demo app /  │  ───────────────────▶│              OFF-CHAIN AGENT                │
│ load-gen     │   (HTTP / WS)        │                                             │
│ (browser)    │◀───────────────────  │  ┌───────────────┐   ┌────────────────────┐│
└──────┬───────┘   live state (WS)    │  │ Request Queue │──▶│ Conflict Detector  ││
       │                              │  └───────────────┘   └─────────┬──────────┘│
       │ connect + sign (CIP-30)      │          ▲                     │ graph      │
       ▼                              │          │           ┌─────────▼──────────┐ │
┌──────────────┐                      │  ┌───────┴───────┐   │  Batch Optimizer   │ │
│   Wallet     │                      │  │  Congestion   │──▶│ (MIS + timing)     │ │
│ (Eternl/Lace)│                      │  │  Predictor    │   └─────────┬──────────┘ │
└──────────────┘                      │  └───────▲───────┘             │ batch      │
                                      │          │           ┌─────────▼──────────┐ │
                                      │          │           │    Tx Builder      │ │
                                      │          │           │ (Lucid/MeshJS)     │ │
                                      │          │           └─────────┬──────────┘ │
                                      └──────────┼─────────────────────┼────────────┘
                                                 │ block/epoch data    │ submit tx
                                                 ▼                     ▼
                                      ┌─────────────────────────────────────────────┐
                                      │              BLOCKFROST (Preprod)            │
                                      └───────────────────────┬─────────────────────┘
                                                              │
                                                              ▼
                                      ┌─────────────────────────────────────────────┐
                                      │   Cardano Preprod L1  ── batch_settlement.ak │
                                      └─────────────────────────────────────────────┘
```

Three deployable units:
1. **`on-chain/`** — the Aiken validator. Compiled once to `plutus.json`; its address holds the ticket
   UTXOs. See [`onchain-spec.md`](./onchain-spec.md).
2. **`off-chain/`** — the Node/TypeScript agent (the four components + an HTTP/WS server). The brain.
   See [`offchain-spec.md`](./offchain-spec.md).
3. **`demo-app/`** — the Next.js frontend + load generator. The face. See [`demo-and-testing.md`](./demo-and-testing.md).

---

## 2. The batching pipeline (one cycle, step by step)

A "batch cycle" is one iteration of the optimizer's loop. Here's a single cycle end to end:

```
 1. Users submit requests ──▶ appended to Request Queue (in-memory, ordered by arrival).
 2. Congestion Predictor (running on its own timer) has a current score S ∈ [0,1].
 3. Optimizer wakes on its batch window. Window length is a function of S:
        S high  ▶ long window (e.g. up to 60s), gather more before firing.
        S low   ▶ short window (e.g. 5–10s), fire fast for low latency.
 4. Conflict Detector takes the current queued requests ──▶ builds contention graph G.
 5. Optimizer solves Maximum Independent Set on G ──▶ largest conflict-free subset B.
        (Requests not in B stay queued for the next cycle — they weren't rejected, just deferred.)
 6. Tx Builder:
        a. fetch the live UTXOs referenced by B from Blockfrost
        b. build the batch redeemer (list of ClaimEntry)
        c. attach or reference the compiled validator
        d. request wallet signature(s) via CIP-30
        e. submit via Blockfrost
        f. await confirmation
 7. On success: mark those requests settled, remove from queue, emit "settled" event to the frontend
        with real fee data. On failure: see §5 (failure handling).
 8. Loop.
```

The **adaptive** part is entirely in steps 2–3: the same pipeline behaves differently under load
because the congestion score reshapes the window (and therefore batch size).

---

## 3. Sequence diagram (happy path)

```
Frontend    Agent(Queue)   ConflictDet   CongPred   Optimizer   TxBuilder   Blockfrost   Wallet   L1
   │  submit()   │             │            │           │           │           │          │       │
   ├────────────▶│ enqueue     │            │           │           │           │          │       │
   │             │             │            │  poll blocks (timer)   │           │          │       │
   │             │             │            ├───────────────────────────────────▶│         │       │
   │             │             │            │◀── last N blocks ──────────────────┤          │       │
   │             │             │            │ recompute score (EWMA)             │          │       │
   │             │             │            │           │           │           │          │       │
   │             │  window fires (len = f(score))       │           │           │          │       │
   │             │────────────▶│ build graph│           │           │           │          │       │
   │             │             ├───────────────────────▶│ MIS(G)    │           │          │       │
   │             │             │            │           ├──────────▶│ build tx  │          │       │
   │             │             │            │           │           ├──────────────────────▶│ sign  │
   │             │             │            │           │           │◀── signed ────────────┤       │
   │             │             │            │           │           ├──────────▶│ submit   │       │
   │             │             │            │           │           │           ├─────────────────▶ │
   │             │             │            │           │           │           │◀── confirmed ─────┤
   │◀── settled event (batch composition + real fees) ──────────────┤           │          │       │
```

---

## 4. Component contracts (interfaces between the pieces)

These are the seams. Keeping them clean lets on-chain and off-chain work proceed in parallel and lets
the demo mock any piece. Full TypeScript types live in [`offchain-spec.md`](./offchain-spec.md); this is
the conceptual contract.

| Producer | Consumer | Payload | Notes |
|---|---|---|---|
| Frontend / load-gen | Request Queue | `UserRequest { id, kind, targetUtxoRef, claimant, ts }` | over HTTP POST or WS |
| Request Queue | Conflict Detector | `UserRequest[]` (current snapshot) | pull, per cycle |
| Conflict Detector | Batch Optimizer | `ContentionGraph { nodes, edges }` | edges = conflicts |
| Congestion Predictor | Batch Optimizer | `score: number` in `[0,1]` | read anytime; updated on a timer |
| Batch Optimizer | Tx Builder | `Batch { requests: UserRequest[] }` | the chosen MIS |
| Tx Builder | Blockfrost | signed tx CBOR | submit |
| Tx Builder | Frontend | `SettlementResult { txHash, batchSize, feeLovelace, naiveFeeEstimate }` | for the "fees saved" counter |
| Congestion Predictor | Frontend | `score` stream | for the live gauge |

**Key design rule:** the Conflict Detector and Batch Optimizer are **pure functions of their inputs** —
no chain access, no I/O. That makes them trivially unit-testable with mocked graphs and is why the
roadmap builds them before any Blockfrost integration exists.

---

## 5. Failure handling (the parts that break at the demo)

Hackathon demos die on the unhappy path. Design for these explicitly:

| Failure | Cause | Handling |
|---|---|---|
| **Stale UTXO** | A UTXO in the batch got spent between graph-build and submit (someone else, or a prior cycle) | Tx Builder re-fetches UTXOs immediately before building; on submit rejection, drop the offending request back to the queue and retry the rest next cycle. |
| **Batch too large** | MIS chose more requests than fit in `maxTxExUnits` | Optimizer caps batch size at a **calibrated max** (from `aiken check` benchmarks, see `onchain-spec.md` §6). Cap is a hard number, not a guess. |
| **Missing collateral** | Wallet has no collateral UTXO set | Fail fast at startup with a clear error; the demo checklist (`demo-and-testing.md`) requires collateral pre-set. |
| **Submit throttled** | Blockfrost free-tier rate limit under load | Congestion-aware backoff naturally reduces submit frequency; add a simple client-side rate limiter in `blockfrostClient.ts`. |
| **Partial batch failure** | Script rejects the whole tx because one entry is invalid | Validator is all-or-nothing by design; the Optimizer must only ever produce *valid* batches (all `Open`, all authorized, no dupes). Treat a script rejection as a bug to investigate, not a runtime-expected event. |

**Design invariant:** the off-chain Optimizer is responsible for only ever proposing batches the
on-chain validator will accept. The validator is the safety net, not the filter. If a batch is rejected
on-chain, that's a defect in the Optimizer's checks, not normal operation.

---

## 6. Concurrency model & the state-splitting invariant

The whole point is preserving concurrency, so the architecture must not re-centralize state:

- Ticket state is spread across **many UTXOs** (one per ticket, or small groups), never one shared pot.
- After a settlement, outputs **stay split** (validator rule #6 in `onchain-spec.md`). Collapsing state
  into one output would make the *next* batch collide on that single UTXO — recreating the original
  problem one block later.
- This is why the demo seeds N distinct ticket UTXOs (e.g. N=20) rather than one UTXO holding N tickets.

Think of it as: **the batcher removes contention within a batch; state-splitting preserves the absence
of contention across batches.** Both are required; either alone is insufficient.

---

## 7. What runs where (deployment)

| Unit | Where it runs during the hackathon | Persistence |
|---|---|---|
| Aiken validator | Compiled locally, deployed to Preprod by sending funds to its address | On-chain (Preprod) |
| Off-chain agent | Local Node process (or a small cloud VM for the demo) | In-memory queue; no DB needed for MVP |
| Demo frontend | `next dev` locally, or Vercel for a shareable link | Stateless; reads agent over WS |
| Wallet | Browser extension (Eternl/Lace) on Preprod | Holds signing keys + collateral |

No database is required for the MVP — the request queue is in-memory. If a persistence story is wanted
for the pitch ("requests survive an agent restart"), that's a stated next step, not MVP scope.

---

## 8. Boundaries deliberately not crossed

- The agent never holds user funds beyond the tickets it settles; it orchestrates, the validator enforces.
- The Conflict Detector reads a **local request queue**, not the real Cardano mempool, for the MVP
  (Blockfrost's mempool is non-global and only shows Blockfrost-submitted txs — see `glossary.md`).
  Real-mempool detection is a stretch goal.
- No cross-dApp routing in the MVP; the "network-effect flywheel" is a pitch narrative (`pitch-and-risks.md`),
  not implemented code.
