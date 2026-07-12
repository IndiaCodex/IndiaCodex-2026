# 6-hour sprint plan (SUPERSEDES roadmap.md for timing)

**Reality:** 6 hours, team of 2-3, experienced with Cardano. General Track — "Built on Cardano."
Goal: a **real batched settlement on Preprod** + a **live adaptive demo** with a verifiable fees-saved
number. `roadmap.md` (10-day) is archived; this doc governs.

---

## The one architecture decision that saves you 2 hours

**No browser wallet. No CIP-30. No collateral UX.** Sign the settlement **server-side** with a
seed-phrase wallet (mnemonic in `.env`) via **Lucid Evolution + Blockfrost**. Your users are simulated,
so wallet-connect buys you nothing and costs you hours of debugging.

**One Next.js app.** All simulation (conflict graph, congestion, MIS, viz) runs **client-side**. Exactly
**one** server route — `POST /api/settle` — does the real Preprod transaction. That's the whole system.

```
Browser (client): loadgen → queue → ConflictDetector → CongestionPredictor → MIS Optimizer → viz + counters
        │  POST /api/settle { claims: [{utxoRef, claimant}] }
        ▼
Next.js API route (server): Lucid + seed wallet + Blockfrost → build+sign+submit batch tx → { txHash, feeLovelace }
        ▼
Cardano Preprod  ── batch_settlement.ak  (seeded ticket UTXOs)
```

---

## Scope: IN / CUT

**IN (must ship):**
- Aiken validator (trimmed to 4 rules — see below), deployed to Preprod.
- Seed ~10 ticket UTXOs at the script address.
- **One real batched settlement tx** on Preprod (multiple claims, one tx) → Cardanoscan link on screen.
- Off-chain pipeline: conflict graph + EWMA congestion (+ manual override) + greedy MIS.
- Single-page demo: request stream, live congestion gauge, **contention graph with MIS highlighted**,
  naive vs batched tx count, **live "fees saved" counter** using the real tx fee.
- Loadgen with 2 presets (heavy-contention / spread).

**CUT (say as "next steps" on the last slide):**
- Browser wallet / CIP-30 · reference script · trained-ML congestion · real mempool detection ·
  DEX variant · DB/persistence · multi-cycle deferral sophistication · the full 6-rule validator.

---

## Trimmed validator (4 rules, not 6)

Keep it correct but minimal. Rules from `onchain-spec.md`, cut to what fits:
1. Each claimed input has `status == Open`.
2. Each `claimant` is in `self.extra_signatories` (server wallet signs; one signer can authorize the
   demo batch — disclose it).
3. No duplicate `utxo_ref` in `claims` (no double-claim).
4. **State stays split:** continuing script outputs ≥ number of claims. *(Keep this one — it's the
   eUTXO-credibility rule and it's cheap. Judges who know Cardano look for it.)*

Drop for now: explicit "claim maps to a real input" (Lucid controls inputs), detailed owner-reassignment
checks. Write a `test` for each of the 4 rules **plus** at least one rejection test (duplicate ref).

---

## Timeline — 3 people in parallel

Roles: **P1 = on-chain**, **P2 = off-chain logic**, **P3 = frontend/viz**. (2-person fallback below.)

### H0 → H0:20 — All: kickoff
- Agree on this architecture, the `/api/settle` request shape, and the ticket datum.
- Scaffold ONE Next.js app (`npx create-next-app`). Add `on-chain/` alongside for Aiken.
- Put Blockfrost Preprod key + seed mnemonic in `.env.local`. Fund the seed wallet from the faucet **now**
  (faucet can be slow — do it first thing).
- **Time-saver (ADR-007):** consider **Yaci DevKit** — a local devnet with instant `topup` funding and
  sub-second blocks (Blockfrost-compatible API, no key). Iterate on Yaci, then do the **final settlement on
  Preprod** for the public Cardanoscan link. Switching is just a `BLOCKFROST_URL` change. See
  [`cardano-tools.md`](./cardano-tools.md).

### H0:20 → H1:30
- **P1:** Write `batch_settlement.ak` (4 rules) + `types.ak`. `aiken build` → `plutus.json`. Write a Lucid
  server util (`lib/lucid.ts`): provider = Blockfrost, wallet from seed. **Smoke test: seed 1 ticket,
  claim it in a single tx on Preprod.** Do NOT move on until this confirms.
- **P2:** `conflictDetector.ts` (group-by-target graph) + `optimizer.ts` (greedy min-degree MIS + cap).
  Pure functions, quick unit tests. Define shared TS types (`UserRequest`, `ContentionGraph`, `Batch`).
- **P3:** Next.js page shell: two-panel layout (naive | batcher), request-stream list, congestion gauge
  placeholder, counter placeholders. Wire a mock data source so you can build UI without waiting.

### H1:30 → H3:00
- **P1:** **Batch settlement** — build a multi-input claim tx (N inputs → N `Claimed` outputs, one tx).
  Seed ~10 tickets. Get **one real batched settlement confirmed** on Preprod; capture `txHash` + fee.
- **P2:** `congestion.ts` — EWMA over Blockfrost latest-N block fullness + a **manual override** (Preprod
  is quiet; you must be able to drive the score). Score→window mapping. Build the client-side **agent
  loop**: queue → build graph → MIS → produce batch → (later) call `/api/settle` → compute fees-saved.
- **P3:** **Contention-graph viz** — highlight the chosen MIS. Use `react-force-graph-2d` or plain SVG;
  don't gold-plate. Live congestion gauge bound to a number.

### H3:00 → H4:00
- **P1:** Wrap the working settlement as `POST /api/settle` → returns `{ txHash, feeLovelace }`. Also add
  a `/api/reseed` (or a script) to refresh ticket UTXOs between demo runs. Hand the endpoint to P3/P2.
- **P2:** Naive-fee baseline: submit ONE single-claim tx once, record real fee `f1`; naive estimate =
  `N * f1`. `savedLovelace = N*f1 - feeLovelace`. Wire the loop to actually call `/api/settle`.
- **P3:** Fees-saved counter + tx-count (naive vs batched) + **Cardanoscan link** for the settlement tx.
  Loadgen with 2 presets.

### H4:00 → H5:00 — All: INTEGRATE
- Run the full flow: loadgen burst → pipeline → real `/api/settle` on Preprod → counters + graph update.
- Fix the integration bugs (there will be some). This hour is the point of the whole day — protect it.

### H5:00 → H5:40 — Harden + record
- Run the demo **twice** end-to-end on the actual demo machine/network.
- **Record a backup video of a successful run** (non-negotiable insurance).
- Pre-seed fresh tickets so the live run starts clean.

### H5:40 → H6:00 — Pitch
- 5-slide deck (skeleton in `pitch-and-risks.md` §8) + rehearse the ~2-min script below.

---

## 2-person fallback
P1 does on-chain **and** the `/api/settle` route. P2 does off-chain logic **and** frontend, keeping the
UI deliberately plain (lists + numbers + a simple SVG graph, skip the fancy force layout). Same timeline,
cut the graph animation and one loadgen preset.

---

## Fallback ladder (if behind — check at H3:30)

Descend only as needed; each rung still gives a legitimate submission:
1. **Batch tx not working by H3:30** → ship a **single real claim tx** on Preprod (still "Built on
   Cardano" proof) and simulate the multi-claim batch in the UI, disclosed. Keep pushing the batch tx in
   parallel.
2. **On-chain fully stuck** → show validator code + `aiken check` passing + the deployed **script
   address** on Cardanoscan, and run the settlement **simulated**. Say the tx-building is the last mile.
3. **Always-true floor:** the client-side adaptive demo (graph + congestion + MIS + fees math) works with
   zero chain access. That is your guaranteed deliverable. Never let integration risk break it.

**Rule:** the off-chain demo must run standalone at all times. Gate the real `/api/settle` call behind a
toggle so a Preprod hiccup never blanks the screen — fall back to simulated fees instantly.

---

## 2-minute demo script
1. **(20s)** "A UTXO can be spent by one tx at a time. 10 tickets, 40 claimers — watch." Naive preset →
   failures pile up.
2. **(30s)** Switch to batcher. Show the **contention graph**, MIS highlighted, settling as one tx.
3. **(30s)** Drive the **congestion score** up → batch window grows, batch gets bigger; drop it → clears
   fast. That's "adaptive," made visible.
4. **(25s)** **Real Preprod settlement** — click the **Cardanoscan link**. Point at the **fees-saved
   counter** (real fee vs N×single-claim fee).
5. **(15s)** "Shared infra — like ERC-4337 bundlers, but structurally necessary on Cardano. Next: staked
   operators, multi-dApp routing, Catalyst." → Q&A (`pitch-and-risks.md` §7).

---

## Pre-flight (before you present)
- [ ] Seed wallet funded on Preprod; fresh ticket UTXOs seeded (`status = Open`).
- [ ] `/api/settle` confirmed working within the last 30 min (Preprod state drifts).
- [ ] Blockfrost rate limit OK for your burst size (keep burst ≤ ~15 live calls; simulate the rest).
- [ ] Congestion override wired + labeled "simulated."
- [ ] Backup video ready. Cardanoscan link opens.
