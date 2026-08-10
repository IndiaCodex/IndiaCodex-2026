# Roadmap — milestones, tasks, ownership

> ⚠️ **SUPERSEDED FOR TIMING by [`6hr-sprint.md`](./6hr-sprint.md).** The actual window is 6 hours, not
> 10 days. Use the sprint plan to decide *what to build and when*. This doc is kept only as a fuller task
> breakdown you can borrow detail from — the milestone ordering here is not the plan of record.

Maps `Projectidea.md` §10 to concrete, checkable tasks with a definition of done. 10-day window, 1 offline
day (team formation in Hyderabad). Two workstreams — **on-chain** and **off-chain** — that proceed in
parallel and meet at the integration milestone.

Ownership: assign each stream a lead on Day 1. The pure off-chain components (Conflict Detector, Batch
Optimizer) have **no chain dependency**, so off-chain work is not blocked waiting on the validator.

---

## Milestone 0 — Scaffold (Day 1, offline)

- [ ] Confirm the ADRs in [`decisions.md`](./decisions.md) (library, scenario, conflict source, etc.).
- [ ] Create the repo structure (`Projectidea.md` §4): `on-chain/`, `off-chain/src/`, `demo-app/`, `README.md`.
- [ ] Assign on-chain vs off-chain owners.
- [ ] Set up Blockfrost **Preprod** project + key; fund a Preprod wallet from the faucet; **set collateral**.

**Done when:** the tree exists, `aiken --version` and the off-chain toolchain run, and a wallet holds test ADA.

---

## Milestone 1 — Aiken validator core (Days 2–3, on-chain)

- [ ] `lib/types.ak`: `BatchDatum`, `Status`, `ClaimEntry`, `BatchRedeemer` (`onchain-spec.md` §2).
- [ ] `validators/batch_settlement.ak`: spend handler + the 6 rules (`onchain-spec.md` §4).
- [ ] `test` for every rule, **including rejection cases**.
- [ ] Parameterized batch-size benchmark → record `N_max` (`onchain-spec.md` §6).

**Done when:** `aiken check` passes all rule + rejection tests, `aiken build` emits `plutus.json`, and
`N_max` is recorded.

---

## Milestone 2 — Basic lock/unlock on Preprod (Day 3, both)

The critical de-risking step: prove the on-chain ↔ off-chain loop works **before** batch logic.

- [ ] `txBuilder.ts` + `blockfrostClient.ts` skeleton (chosen library per ADR-001).
- [ ] Seed **one** ticket UTXO at the script address (`status = Open`).
- [ ] Claim it in a single transaction end-to-end; confirm on-chain.

**Done when:** a single ticket is seeded and claimed on Preprod, confirmed via Blockfrost. If this fails,
stop and fix — nothing downstream works without it.

---

## Milestone 3 — Conflict Detector + Batch Optimizer (Days 4–5, off-chain, no chain)

- [ ] `conflictDetector.ts`: group-by-target graph builder (`offchain-spec.md` §1).
- [ ] `batchOptimizer.ts`: greedy min-degree MIS + `cap` (`offchain-spec.md` §3).
- [ ] Unit tests with mocked requests/graphs, including the all-conflict / no-conflict extremes.

**Done when:** given mocked requests, the pipeline returns a correct conflict-free batch within `cap`,
fully unit-tested, with zero chain calls.

---

## Milestone 4 — Congestion Predictor (Day 6, off-chain)

- [ ] `congestionPredictor.ts`: EWMA over Blockfrost block fullness, timer-driven, cached score
      (`offchain-spec.md` §2).
- [ ] Score → batch-window mapping + the "simulate congestion" override.
- [ ] Tests for EWMA output, threshold mapping, clamping.

**Done when:** a live score in `[0,1]` updates from real Preprod block data and the override can drive it
for the demo.

---

## Milestone 5 — Wire the full pipeline (Day 7, both)

- [ ] `index.ts`: request queue + Optimizer loop + predictor timer + HTTP/WS server (`offchain-spec.md` §5).
- [ ] Tx Builder builds the **real multi-input batch settlement** tx and submits to Preprod.
- [ ] Deferred requests re-enter the queue and settle across cycles.
- [ ] **(ADR-004 gate)** if on schedule, add the reference-script optimization; else defer.

**Done when:** simulated requests flow end-to-end to a **real batched settlement tx** on Preprod, and a
heavy-contention burst settles fully over multiple cycles.

---

## Milestone 6 — Demo frontend (Day 8, off-chain/frontend)

- [ ] Next.js app showing the four required visuals (`demo-and-testing.md` §2): incoming requests, live
      congestion score, batch composition (**contention graph with MIS highlighted**), before/after fees.
- [ ] Live "fees saved" counter wired to real `SettlementResult` data (`fee-economics.md` §4).
- [ ] Naive vs batcher side-by-side toggle.

**Done when:** the two paths render side by side and the fees-saved counter moves on real data.

---

## Milestone 7 — Polish & load test (Day 9, both)

- [ ] Load-test 30–50 concurrent requests with both presets; fix stale-UTXO, rate-limit, collateral edges.
- [ ] Tune EWMA `alpha` and window thresholds so adaptivity is visible on the demo network.
- [ ] Record a **backup demo video**.
- [ ] **(Stretch, only if early)** mini-DEX variant (ADR-002) — do not risk the working MVP for it.

**Done when:** the full demo runs reliably twice in a row on the demo machine, and a backup video exists.

---

## Milestone 8 — Pitch (Day 10)

- [ ] Deck: problem → solution → live demo → fee number + `N_max` → positioning → risks/next steps
      (`pitch-and-risks.md`).
- [ ] Rehearse the ≈3-minute demo script (`demo-and-testing.md` §6).
- [ ] Prep Q&A answers, especially the risk questions (`pitch-and-risks.md` §Q&A).

**Done when:** the deck is done, the demo is rehearsed on the real machine, and every risk has a prepared answer.

---

## Critical path & risk

```
M0 ─▶ M1 ─┐
          ├─▶ M2 ─▶ M5 ─▶ M6 ─▶ M7 ─▶ M8
M0 ─▶ M3 ─┤        ▲
     └─ M4 ────────┘
```
- **M2 is the biggest single risk** — if the basic on-chain loop doesn't work, batch logic is moot. Do it
  by Day 3 and don't proceed until it's green.
- **M3/M4 are independent of the chain**, so they can absorb slack if M1/M2 slip.
- **Guard the MVP:** the DEX stretch (M7) and reference script (M5 gate) are optional. Never trade a
  working ticket-claim demo for an unfinished stretch feature.

## Definition of done (whole project)
A live, on-Preprod demo where a burst of simulated concurrent claims settles through the adaptive pipeline
into a small number of batched transactions, the congestion score visibly reshapes batch size, and a
real, verifiable "fees saved" number is on screen — pitched as reusable Cardano infrastructure with its
risks named honestly.
