# Off-chain spec — the four components

The TypeScript agent. Four components, each with a clear input/output contract, an algorithm, and the
edge cases that matter. Everything here lives under `off-chain/src/`.

Design principles carried throughout:
- **Conflict Detector and Batch Optimizer are pure** — no I/O, no chain access. Deterministic functions of
  their inputs, so they unit-test with mocked data and can be built before Blockfrost exists.
- **Congestion Predictor and Tx Builder touch the outside world** (Blockfrost, wallet) — isolate that.
- **Don't overbuild.** The congestion model is an EWMA, not an ML model. MIS is a greedy heuristic, not a
  research contribution. The value is the *system*, not the algorithms (see `pitch-and-risks.md`).

---

## 0. Shared types

```ts
// A pending user request as it enters the queue.
export interface UserRequest {
  id: string;                 // uuid
  kind: "claim" | "swap";     // MVP: "claim"
  targetUtxoRef: string;      // "txHash#index" — the UTXO this request wants to spend
  claimant: string;           // verification key hash (hex)
  ts: number;                 // arrival time (ms). Passed in from outside; do NOT call Date.now() in pure code.
}

export interface ContentionGraph {
  nodes: string[];                    // request ids
  edges: Array<[string, string]>;     // pairs of conflicting request ids
  adjacency: Map<string, Set<string>>;// derived, for fast lookup
}

export interface Batch {
  requests: UserRequest[];
  builtAtScore: number;       // congestion score at selection time (for the UI/telemetry)
}

export interface SettlementResult {
  txHash: string;
  batchSize: number;
  feeLovelace: number;        // actual fee of the batched tx
  naiveFeeEstimate: number;   // estimated fee if each request were its own tx
  savedLovelace: number;      // naiveFeeEstimate - feeLovelace
}
```

---

## 1. Conflict Detector — `conflictDetector.ts`

**Job:** from the current queued requests, build the contention graph.

**Input:** `UserRequest[]`
**Output:** `ContentionGraph`

### Conflict rule (MVP)
Two requests **conflict** iff they target the **same UTXO** (`a.targetUtxoRef === b.targetUtxoRef`).
That's the whole rule for the ticket-claim MVP: two people claiming the same ticket collide.

> Extension (swap/DEX): conflict also when two requests touch the same shared state region (same pool
> datum). Keep the rule pluggable — a single `conflicts(a, b): boolean` predicate — so the graph builder
> doesn't change when the rule grows.
>
> Real-mempool stretch (ADR-008): detecting conflicts among *actual* pending Cardano txs (not our local
> queue) needs mempool access. Blockfrost's free tier can't; **Maestro** offers real mempool monitoring —
> that's the concrete upgrade path, named as a next step, not built in the MVP.

### Algorithm
```
build(requests):
  nodes = [r.id for r in requests]
  edges = []
  # group by targetUtxoRef; any two in the same group conflict
  groups = groupBy(requests, r => r.targetUtxoRef)
  for group in groups where group.length > 1:
    for each unordered pair (a, b) in group:
      edges.push([a.id, b.id])
  adjacency = buildAdjacency(nodes, edges)
  return { nodes, edges, adjacency }
```
Grouping first makes this **O(n)** in the common case instead of O(n²) pairwise comparison — worth doing
because the demo fires 30–50 requests at once and we may run this every cycle.

### Edge cases
- **No conflicts** (all target distinct UTXOs) → empty edge set → the whole queue is one batch.
- **All conflict** (everyone wants the same one ticket) → complete graph → MIS is exactly 1 (only one
  claimer wins per cycle; the rest defer). This is the dramatic demo moment; make sure it renders clearly.
- **Duplicate request ids** → reject at the queue boundary, not here (keep this pure).

### Tests
Mocked request arrays → assert exact edges. Include the "all-conflict" and "no-conflict" extremes.

---

## 2. Congestion Predictor — `congestionPredictor.ts`

**Job:** emit a live congestion score in `[0,1]`.

**Input:** recent block data from Blockfrost (last N blocks): each block's `size` and the network
`maxBlockBodySize` protocol parameter. Optionally mempool size (Blockfrost, hosted only) as a secondary
signal.
**Output:** `score: number` in `[0,1]`, refreshed on a timer.

### Algorithm (MVP = EWMA of block fullness)
```
# per-block fullness in [0,1]
fullness(block) = block.size / maxBlockBodySize

# on each new block (or each poll), update the EWMA:
score = alpha * fullness(latestBlock) + (1 - alpha) * score
        # alpha in (0,1]; larger alpha = reacts faster, noisier. Start alpha = 0.3.
```
- Seed `score` with the average fullness of the last N blocks (e.g. N = 10) on startup so it isn't 0.
- Clamp to `[0,1]` defensively.
- **Do not** build a trained model for the MVP. If time allows as a stretch, fit a tiny regression on
  historical epoch data — but only after the whole pipeline works end to end.

### Why EWMA (say this if asked)
It reacts quickly to a congestion spike (recent blocks dominate), needs no training data, is a few lines
of code, and is trivial to explain to judges. It is the *right* amount of engineering for a signal whose
only job is to nudge a timing window.

### Mapping score → batch window (consumed by the Optimizer)
```
windowMs(score):
  if score > 0.7:  return 60_000    # congested: wait, gather a big batch
  if score < 0.3:  return  7_000    # quiet: clear fast for low latency
  else:            return linear interpolation between the two   # e.g. 7s..60s
maxBatchSize(score): optionally also grow the cap with score, bounded by the aiken-check calibrated max.
```
These thresholds are demo knobs — expose them in config so you can tune them live if the demo network
behaves differently than expected.

### Edge cases
- **Blockfrost slow / rate-limited** → keep serving the last known score; never block the Optimizer on a
  network call. The predictor runs on its own timer and the Optimizer only *reads* the cached score.
- **Preprod is quiet** (it usually is) → real fullness may hover near 0, so the demo needs a way to
  *inject* synthetic congestion for the live "watch the batch grow" moment. Provide a manual override
  ("simulate congestion" slider) that feeds the same score input. Disclose it's simulated — it's
  demonstrating the *policy*, and the policy is real.

---

## 3. Batch Optimizer — `batchOptimizer.ts`

**Job:** choose the largest conflict-free set of requests and decide when to fire.

**Input:** `ContentionGraph` + `score` (+ the calibrated max batch size from `aiken check`).
**Output:** `Batch`

### Algorithm (Maximum Independent Set, greedy)
MIS is NP-hard in general, but our graphs are small (tens of nodes) and sparse (most requests target
different tickets). A **greedy minimum-degree heuristic** is more than good enough and is easy to explain:

```
selectBatch(graph, cap):
  remaining = set(graph.nodes)
  chosen = []
  while remaining not empty and chosen.length < cap:
    # pick the node with the FEWEST remaining conflicts (least likely to block others)
    v = argmin over remaining of degree(v within remaining)
    chosen.push(v)
    remove v and all its neighbors from remaining   # neighbors conflict with v → can't join this batch
  return chosen
```
- `cap` = calibrated max batch size from the on-chain benchmark (`onchain-spec.md` §6). Never exceed it.
- The greedy min-degree order tends to keep the most requests; if you want a stronger result later, drop
  in an exact solver for small graphs or run greedy from a few random seeds and keep the best. Not needed
  for MVP. If you add randomness, seed it deterministically per cycle (do not use `Math.random()` in code
  that must be reproducible for tests) — vary by cycle index.

### Timing
The Optimizer's loop window is `windowMs(score)` from §2. Requests not chosen this cycle **stay queued**
(deferred, not rejected) and are reconsidered next cycle — over successive cycles, everyone eventually
gets settled as conflicting claimants take turns.

### Output guarantee (critical)
The Optimizer must only ever emit batches the **on-chain validator will accept**. Before returning a
batch, it re-checks the invariants the validator enforces (all targets currently `Open`, no duplicate
UTXO refs, each claimant present). The validator is the safety net; the Optimizer is the filter
(`architecture.md` §5).

### Tests
Mocked graphs → assert chosen set is (a) conflict-free, (b) within `cap`, (c) maximal-ish (no obviously
addable node left out). Include the "all-conflict → exactly 1 chosen" and "no-conflict → all chosen (up
to cap)" extremes.

---

## 4. Tx Builder — `txBuilder.ts` (+ `blockfrostClient.ts`)

**Job:** turn a `Batch` into a confirmed on-chain settlement transaction. The only component that signs
and submits.

**Input:** `Batch`
**Output:** `SettlementResult`

### Responsibilities
1. **Fetch live UTXOs** for the batch's `targetUtxoRef`s from Blockfrost, *immediately before building*
   (guards against stale-UTXO failures — `architecture.md` §5).
2. **Build the redeemer** — construct `BatchRedeemer { claims: ClaimEntry[] }` from the batch.
3. **Attach or reference the validator** — read the compiled script from `plutus.json`; use a reference
   script if ADR-004 says so, otherwise embed.
4. **Balance + build** the tx via Lucid Evolution / MeshJS (whichever ADR-001 picks).
5. **Sign** via the connected CIP-30 wallet.
6. **Submit** via Blockfrost; **await confirmation** (poll tx status).
7. **Return `SettlementResult`** including the **actual fee** (from the built tx) and the **naive fee
   estimate** for the same requests as separate txs (see `fee-economics.md` for the estimate formula).

### `blockfrostClient.ts`
Thin wrapper: `getUtxos(address)`, `getUtxo(ref)`, `getLatestBlocks(n)`, `getProtocolParameters()`,
`submitTx(cbor)`, `awaitTx(hash)`. Centralize the API key (from env), a **client-side rate limiter**
(free tier limits will bite under 30–50-request load), and retry/backoff. Never hardcode protocol
params — fetch `getProtocolParameters()` so fee math uses live `minFeeA`/`minFeeB`/exec prices.

> **Provider options (ADR-008, `cardano-tools.md`).** The base URL is env-driven, so the same client works
> against three backends by changing `BLOCKFROST_URL`: **Blockfrost** (primary, Preprod public testnet),
> **Yaci DevKit** (local devnet, Blockfrost-compatible, no key — for fast iteration), or point congestion
> reads at **Koios** (keyless, `https://preprod.koios.rest/api/v0`) to spare Blockfrost's rate limit under
> burst load. **Maestro** is the provider that would enable real mempool-based conflict detection
> (§6.1 stretch) — it exposes pending-tx monitoring Blockfrost's free tier does not.

### Edge cases
- **Stale UTXO on submit** → drop the offending request back to the queue, settle the rest next cycle.
- **Missing collateral** → detect at startup, fail with a clear message (demo checklist requires it set).
- **maxTxExUnits exceeded** → shouldn't happen if the Optimizer respects `cap`; if it does, it's a
  calibration bug — lower the cap.

---

## 5. Server & wiring — `index.ts` (agent entrypoint)

- HTTP/WS server exposing: `POST /request` (enqueue), `WS /events` (stream score + settlements to the UI).
- Owns the in-memory **Request Queue** and the Optimizer loop.
- Starts the Congestion Predictor timer.
- Config (env / a `config.ts`): Blockfrost key + network, EWMA `alpha`, window thresholds, batch `cap`,
  script address, agent wallet.

### The loop (pseudocode)
```
onStart:
  predictor.startPolling()           // updates cached score on a timer
  loop:
    window = windowMs(predictor.score)
    await sleep(window)              // in real code, timer-driven; keep the queue accepting during the wait
    reqs  = queue.snapshot()
    if reqs.empty: continue
    graph = conflictDetector.build(reqs)
    batch = optimizer.selectBatch(graph, predictor.score, cap)
    if batch.empty: continue
    result = await txBuilder.settle(batch)
    queue.remove(batch.requests)     // only those actually settled
    emit("settled", result)
```

---

## 6. What's mocked vs real at each milestone
See [`roadmap.md`](./roadmap.md). Short version: build Conflict Detector + Optimizer against **mocked
requests** first (no chain), add the Congestion Predictor (real Blockfrost reads) next, and wire the Tx
Builder to real Preprod submission last. The pure components never change when the chain gets plugged in —
that's the payoff of the purity rule.
