# Demo & testing

What to build for the demo, how to drive it, and how to test the whole thing so it survives a live run in
front of judges.

---

## 1. The demo scenario (ticket-claim)

**Story:** a limited drop of N tickets (N = 20). A crowd of 30–50 people all try to claim at the same
instant. Show what eUTXO contention does — and what the batcher does about it.

**Two paths, side by side on one screen:**

| | Naive path | Batcher path |
|---|---|---|
| How requests are sent | each claim → its own transaction | each claim → the agent's request queue |
| What judges see | many txs **fail / queue** fighting over the same ticket UTXOs | requests flow through Conflict Detector → Congestion Predictor → Batch Optimizer → **a handful of settlement txs** |
| Headline number | high tx count, wasted fees | low tx count, **live "fees saved" counter** |
| The wow moment | red "failed" pile grows | congestion score changes on screen and the **batch size grows/shrinks live** |

---

## 2. What the frontend must show

Per `Projectidea.md` §7, the UI needs four visible elements:

1. **Incoming requests** — a live list/stream of claims arriving (id, target ticket, claimant).
2. **Congestion score** — a gauge/number in `[0,1]` updating live, with the current batch window it maps to.
3. **Batch composition** — which requests got grouped into the current settlement (and which deferred),
   ideally rendering the contention graph (nodes + conflict edges + the chosen independent set highlighted).
4. **Before vs after** — naive tx count / total fees vs batched tx count / total fees, plus the running
   **"total ADA saved"** headline (`fee-economics.md` §4).

A rendered **contention graph** with the chosen MIS highlighted is the single most persuasive visual —
it makes "concurrency-aware" concrete. Prioritize it.

---

## 3. Load generation

A script, not real users (`Projectidea.md` §7). `demo-app` (or a small `scripts/loadgen.ts`) fires
30–50 `POST /request` calls in a short burst. Provide **presets** so the demo is deterministic:

- **"Heavy contention"** — most requests target the **same few tickets** → dramatic conflict graph, MIS
  shrinks to a few winners per cycle, many deferrals. Best for showing the problem.
- **"Spread"** — requests target **distinct tickets** → near-complete independent set → one big clean batch.
  Best for showing best-case throughput and fee savings.
- **"Mixed"** — realistic blend.

Seeding: pass request timestamps/ids **into** the loadgen (don't rely on wall-clock randomness inside pure
code). A fixed seed → a reproducible demo you can rehearse.

---

## 4. Demo pre-flight checklist (the things that kill live demos)

Run through this **before** presenting. Every item here maps to a real failure mode in
[`architecture.md`](./architecture.md) §5.

- [ ] Wallet (Eternl/Lace) on **Preprod**, funded from the faucet, with **collateral set** (contract calls
      fail silently without it).
- [ ] Blockfrost **Preprod** project key in env; verify `getProtocolParameters()` returns live values.
- [ ] Validator built (`aiken build` → `plutus.json`), script address funded with **N seed ticket UTXOs**,
      each with datum `status = Open`.
- [ ] Confirmed the **calibrated max batch size** `N_max` from `aiken check`; Optimizer `cap` set to it.
- [ ] Rate limiter on the Blockfrost client tested under a 50-request burst (free tier will throttle).
- [ ] "Simulate congestion" override wired (Preprod is usually quiet — you need to *drive* the score to
      show adaptivity), and clearly labeled as simulated in the UI.
- [ ] Naive-side fee number sourced (measured single-claim fee `f₁`, or formula) — `fee-economics.md` §4.
- [ ] A recorded backup video of a successful run, in case the network misbehaves live.
- [ ] **If you rebuilt (`npm run build`), RESTART the server** — kill any stale process on `:3000`
      (`netstat -ano | grep :3000` → `taskkill //PID <pid> //F` on Windows) before `npm run start`.
      A stale server serves old HTML referencing deleted chunks → `ChunkLoadError` → blank page. (Learned
      the hard way during browser verification.) `npm run dev` avoids this entirely for local demos.

---

## 5. Test plan

### On-chain (`aiken check`) — run continuously
- One `test` per validator rule (`onchain-spec.md` §4), **including rejection cases**: already-`Claimed`
  input, duplicate `utxo_ref`, unsigned claimant, collapsed output (rule 6). A validator with only
  happy-path tests will approve a bad batch.
- The parameterized batch-size benchmark (§6 of onchain-spec) → produces `N_max`.

### Off-chain unit tests (pure components — no chain)
- **Conflict Detector:** mocked request arrays → exact expected edges; test the no-conflict and
  all-conflict extremes.
- **Batch Optimizer:** mocked graphs → chosen set is conflict-free, within `cap`, and maximal-ish; test
  "all-conflict → exactly 1" and "no-conflict → all up to cap."
- **Congestion Predictor:** feed a sequence of fullness samples → assert EWMA output; test the score→window
  mapping thresholds (0.3, 0.7 boundaries) and clamping.

### Integration (against Preprod)
- **Lock/unlock smoke test first** (roadmap M2): seed one ticket, claim it in a single tx end-to-end
  before any batch logic. If this doesn't work, nothing downstream will.
- **Single-batch settlement:** seed 3 tickets, submit 3 conflicting + 3 distinct requests, assert one
  settlement tx claims the independent set and defers the rest.
- **Load test:** the full 30–50-request burst with both presets; watch for stale-UTXO handling, rate-limit
  behavior, and that deferred requests eventually settle across cycles.

### End-to-end (the demo itself)
- Rehearse the full script (§below) at least twice on the actual demo machine and network.

---

## 6. Demo script (≈3 minutes)

1. **Frame the problem (20s).** "On Cardano, a UTXO can be spent by one tx at a time. 20 tickets, 50
   people — watch." Start the **naive path** with the heavy-contention preset → failures pile up.
2. **Introduce the batcher (30s).** Switch to the **batcher path**, same load. Requests flow into the
   queue; show the **contention graph** render with the chosen independent set highlighted.
3. **Show adaptivity (40s).** Drive the **congestion score** up (simulate) → the batch window lengthens and
   batch size grows; drop it → batches clear fast. This is the "adaptive" claim, made visible.
4. **Show the money (30s).** Point at the **live "fees saved" counter** and the tx-count difference. State
   the measured `N_max` batch ceiling.
5. **Position it (30s).** "This is shared infrastructure — like ERC-4337 bundlers, but structurally
   necessary on Cardano. Any dApp plugs in instead of building its own batcher." Hand to Q&A
   (`pitch-and-risks.md` §Q&A).

---

## 7. Fallbacks
- Network flaky → play the **recorded backup video**, narrate live.
- Blockfrost throttling → lower the burst size; the point still lands at 15 requests.
- Wallet issue → have the backup wallet (Lace) pre-configured and funded.
