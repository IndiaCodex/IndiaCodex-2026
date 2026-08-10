# Build Plan — the granular TODO to complete the project

Execute top to bottom. Each task has a **checkbox**, an **owner** (P1 on-chain · P2 off-chain · P3
frontend), a **time box**, exact **commands/code**, and an **acceptance criterion** (how you know it's
done). Timing is governed by [`6hr-sprint.md`](./6hr-sprint.md); this is the step-by-step *how*.

**Legend:** ⬜ todo · 🔒 blocked-until (dependency) · ✅ already done in the repo.

---

## Status snapshot (what already exists)

> ### 🟢 LIVE ON-CHAIN (Preprod) — verified end to end
> Wallet funded (10,000 tADA) · Blockfrost Preprod key set · contract state deployed.
> - **Seed** (deploy 10 tickets): tx `6ff3b50c…7ab3`
> - **Single claim** (real settlement): tx `0531d1a3…b705` — confirmed, fee **238,189** lovelace
> - **5-ticket BATCH in one tx**: tx `9655d2c2…88a7` — confirmed block 4,927,363, fee **593,035**
>   lovelace vs ~1,250,000 naive → **~53% saved**. The validator held on all 4 rules on real chain.
> Scripts: `npm run seed` · `npm run claim` · `npm run batch`.

✅ All design docs in `Docs/` + `AGENT.md` (operating guide).
✅ **Off-chain modules** in `off-chain/src/` (reference) — `config.ts` (toggles), `types.ts`,
  `blockfrostClient.ts`, `congestion.ts`, `conflictDetector.ts`, `optimizer.ts`, `settlement.ts`.
  **`settleReal` fully wired:** loads the validator from `plutus.json`, `attach.SpendingValidator`,
  builds the batch redeemer + one `Claimed` output per claim (state split), reads fee from
  `completed.fee`. **Verified (no live wallet needed):** validator→address matches `.env.local`
  `SCRIPT_ADDRESS`; datum/redeemer encode + round-trip. Only the live submit needs a funded wallet.
✅ **On-chain** `on-chain/` — `aiken.toml` (pinned Aiken v1.1.23 + stdlib v3.1.0),
  `lib/batcher/types.ak`, `validators/batch_settlement.ak` (4 rules). **Aiken installed; `aiken check` →
  13/13 tests green** (4 pure-helper + accept + 4 reject cases + 4 benchmark sizes); **`aiken build` →
  `plutus.json`.** Validator hash `dbbe34fa…a446`; Preprod script address derived + hash-verified against
  Lucid (MATCH). **Benchmark:** memory-bound ~O(n²), n=24 ≈ 47% of the tx mem limit → **N_max ≈ 30–35**,
  `batchCap=16`. (Aiken binary: `C:\Users\DELL\AppData\Local\aiken-bin\aiken-x86_64-pc-windows-msvc\aiken.exe`.)
✅ **Full Next.js `demo-app/`** — runs **demo mode today, zero chain access**: store, engine loop,
  congestion polling, all components (contention graph, gauge, fees counter, before/after, settlement
  list), loadgen presets, both toggles, and API routes (`/api/settle`, `/api/congestion`,
  `/api/settlement-mode`). `lib/agent/` holds the running copy of the off-chain modules. `scripts/seed.ts`
  is the ticket-seeding tool. **Verified:** `tsc --noEmit` clean · `next build` clean · API routes
  exercised (demo settle returns correct fee math; empty batch → 400).
✅ **Vitest tests** — 27 passing (`npm test`): pure modules (`conflictDetector`, `optimizer`,
  `congestion`, `loadgen`) **+ end-to-end integration** (`integration.test.ts`: heavy contention drains
  over cycles with all settled + fees saved; spread settles in one cycle; batched fee < naive fee).
✅ **Phase 0 environment** — `demo-app/` deps installed; root + `demo-app/.gitignore` (secrets safe,
  verified); `demo-app/.env.local` generated with a **fresh Preprod wallet** (seed + address) and the
  derived `SCRIPT_ADDRESS`. Blockfrost id blank (demo mode runs without it).

**Remaining (this document):** **fund the generated wallet** (faucet needs a captcha/API key — manual) ·
create a **Blockfrost Preprod project** (needs your signup) · full-tx `aiken check` rule tests + the
`N_max` benchmark · wire the validator attach in `settleReal` · seed tickets · one real Preprod
settlement · UI polish · pitch. Phases 0/1(build)/3/4 are done or verified; the critical path is now the
**real settlement (Phase 2/5)**, which is gated only on your Blockfrost key + funded wallet.

> **Run it now (demo mode):** `cd demo-app && npm run dev` → open the page, click a load preset, watch the
> contention graph + fees-saved counter. No chain, no keys needed. (`npm test` runs the 24 unit tests.)

---

## PHASE 0 — Setup & scaffold  ·  ⏱ H0:00–H0:25  ·  ALL

> **Mostly DONE.** The app is scaffolded, deps installed, verified (`tsc`/`next build`/tests green), and
> git hygiene is in place. What remains needs your own accounts/toolchain (Aiken, Blockfrost key, faucet,
> Docker) — those can't be done from the build sandbox. Start-of-session tip: **fund the faucet first, it lags.**

- ✅ **[ALL] Plan confirmed / `/api/settle` shape.** Implemented as `{ requests: UserRequest[],
  builtAtScore }` (the client posts the whole `Batch`); route validates it (empty → 400, over-cap → 400).
- ✅ **[P3] App scaffolded** (ADR-009, `frontend.md`): `demo-app/` Next.js + TS + Tailwind + Zustand +
  recharts + react-force-graph-2d; `@/*` alias; full skeleton (`components/ lib/agent lib/engine stores
  hooks scripts`); agent modules copied to `lib/agent/`. *Verified:* `npm run dev` serves, `tsc --noEmit`
  clean, `next build` clean, `import { selectBatch } from "@/lib/agent/optimizer"` resolves.
- ✅ **[P3] `.gitignore`** (root + `demo-app/`) covers `.env` / `.env.*` (keeps `.env.example`).
  *Verified:* `git check-ignore demo-app/.env.local` returns a path; no secret env file is git-visible.
- ✅ **[ALL] File home decided:** `demo-app/lib/agent/` is the running copy; API routes import
  `@/lib/agent/settlement` etc. (verified by build). `off-chain/src/` remains the reference.
- ✅ **[scaffold] `demo-app/.env.local` created** with demo-mode defaults + clearly-marked `TODO`
  placeholders (Blockfrost id, seed, script address) — app runs in demo mode with these blank.
- ✅ **[P1] Aiken installed + validator built.** Binary v1.1.23 at
  `C:\Users\DELL\AppData\Local\aiken-bin\aiken-x86_64-pc-windows-msvc\aiken.exe` (add to PATH for `aiken`
  to work bare). `aiken check` → 4/4 green; `aiken build` → `on-chain/plutus.json`. Script address
  derived + hash-verified.
- ⬜ **[P2] Blockfrost id + fund the wallet** (needs YOUR accounts — can't be automated):
  - ✅ Wallet generated → `demo-app/.env.local` has `WALLET_SEED` + `SCRIPT_ADDRESS`.
  - ⬜ **Fund the wallet** at https://docs.cardano.org/cardano-testnets/tools/faucet (web captcha) — paste
    the wallet address printed in `.env.local` (`addr_test1qp9qwmgv…qfwh06s`). Fund **now, it lags**.
  - ⬜ Create a **Preprod** project at blockfrost.io → paste the id into `.env.local`
    `BLOCKFROST_PROJECT_ID`. (Or use **Yaci DevKit** with Docker to skip both — ADR-007.)
  - *Accept:* `.env.local` has the Blockfrost id; the wallet address shows funds on Cardanoscan.
- ⬜ **[P1/P2] (Recommended, ADR-007) Yaci DevKit** (needs **Docker** — not in this sandbox): local devnet,
  sub-second blocks, instant funding. `create-node --block-time 0.2 --slot-length 0.2 -o --start`, fund
  with `topup addr_test1... 50000`, point `BLOCKFROST_URL` at Yaci's endpoint (no key). Iterate here; do
  the **final settlement on Preprod** for the public Cardanoscan link. See
  [`cardano-tools.md`](./cardano-tools.md) Tier 2. *Accept:* `topup` funds an address and `getLatestBlocks`
  returns from the Yaci endpoint.

---

## PHASE 1 — Aiken validator  ·  ⏱ H0:25–H3:00  ·  P1

> **1.1–1.3 (build) DONE:** types + validator written, `aiken check` green (4/4 helper tests),
> `aiken build` → `plutus.json`. Remaining in this phase: the **full-transaction rule tests** (mocked
> `Transaction` with reject cases) and the **`N_max` batch-size benchmark**, then **1.4/1.5** (which need
> the funded wallet). The code blocks below are the reference for what was built.

### 1.1 Types  ·  H0:25–H0:45  ✅
- ✅ Created `on-chain/lib/batcher/types.ak` (compiles under Aiken v1.1.23 / stdlib v3.1.0). **Byte-matches
  the `Data.Object` schemas in `settlement.ts`** (verified: Lucid-derived hash == Aiken hash).

```aiken
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference}

pub type Status {
  Open
  Claimed
}

pub type BatchDatum {
  owner: VerificationKeyHash,
  item_id: ByteArray,
  status: Status,
}

pub type ClaimEntry {
  utxo_ref: OutputReference,
  claimant: VerificationKeyHash,
}

pub type BatchRedeemer {
  claims: List<ClaimEntry>,
}
```
*Accept:* `aiken check` compiles the types.

### 1.2 Validator — 4 trimmed rules  ·  H0:45–H1:30  ✅
- ✅ Created `on-chain/validators/batch_settlement.ak` with the 4 rules; compiles + `aiken build` emits
  `plutus.json` (validator hash `dbbe34fa…a446`). Rules (from `onchain-spec.md` §4, trimmed per
  `6hr-sprint.md`): (1) input `Open` · (2) claimant signed · (3) no duplicate `utxo_ref` ·
  (4) **state stays split** (outputs at script addr ≥ claims).

```aiken
use aiken/collection/list
use cardano/transaction.{Transaction, OutputReference, InlineDatum}
use batcher/types.{BatchDatum, BatchRedeemer, ClaimEntry, Open}

validator batch_settlement {
  spend(
    datum: Option<BatchDatum>,
    redeemer: BatchRedeemer,
    own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(d) = datum
    and {
      d.status == Open,                              // this input is Open
      claimed_once(redeemer.claims, own_ref),        // this input is in the batch exactly once
      validate_batch(redeemer, self, own_ref),       // whole-tx checks (order-independent)
    }
  }

  else(_) {
    fail
  }
}

fn claimed_once(claims: List<ClaimEntry>, ref: OutputReference) -> Bool {
  list.count(claims, fn(c) { c.utxo_ref == ref }) == 1
}

fn validate_batch(
  redeemer: BatchRedeemer,
  self: Transaction,
  own_ref: OutputReference,
) -> Bool {
  let claims = redeemer.claims
  and {
    no_duplicate_refs(claims),                                        // rule 3
    list.all(claims, fn(c) { input_is_open(self, c.utxo_ref) }),      // rules 1+ (each input)
    list.all(claims, fn(c) { list.has(self.extra_signatories, c.claimant) }), // rule 2
    state_stays_split(self, own_ref, list.length(claims)),            // rule 4
  }
}

fn no_duplicate_refs(claims: List<ClaimEntry>) -> Bool {
  list.all(claims, fn(c) { list.count(claims, fn(x) { x.utxo_ref == c.utxo_ref }) == 1 })
}

fn input_is_open(self: Transaction, ref: OutputReference) -> Bool {
  when list.find(self.inputs, fn(i) { i.output_reference == ref }) is {
    Some(input) ->
      when input.output.datum is {
        InlineDatum(data) -> {
          expect d: BatchDatum = data
          d.status == Open
        }
        _ -> False
      }
    None -> False
  }
}

// Rule 6 (the concurrency invariant): continuing script outputs >= number of claims.
fn state_stays_split(self: Transaction, own_ref: OutputReference, claim_count: Int) -> Bool {
  expect Some(own_input) = list.find(self.inputs, fn(i) { i.output_reference == own_ref })
  let script_address = own_input.output.address
  let continuing = list.count(self.outputs, fn(o) { o.address == script_address })
  continuing >= claim_count
}
```
> ⚠️ **Verify constructor/module names against your pinned Aiken stdlib version** (`InlineDatum`,
> `extra_signatories`, `OutputReference` field names). They shift between stdlib releases — do not assume.
*Accept:* `aiken build` produces `on-chain/plutus.json`.

> 🔧 **When the validator or a tx misbehaves**, reach for the debugging trio (`cardano-tools.md` Tier 2):
> **Gastronomy** steps through the validator's UPLC execution; **Datum Explorer** confirms your
> `BatchDatum` CBOR matches the on-chain schema (a datum mismatch = silent script fail); **Lace Anatomy**
> decodes a whole failing tx/address/CBOR.

### 1.3 Rule tests (incl. rejection) + benchmark  ·  ✅ DONE
- ✅ Full-transaction `test` blocks (mocked `Transaction` from stdlib `placeholder`):
  `accept_valid_batch_of_3` + the 4 **rejection** cases (`reject_when_an_input_is_claimed`,
  `reject_missing_signature`, `reject_duplicate_utxo_ref`, `reject_collapsed_outputs`). Plus 4 pure-helper
  tests. **`aiken check` → 13/13 green.**
- ✅ **Batch-size benchmark** (`benchmark_batch_4/8/16/24`): memory-bound, ~O(n²) growth; n=24 ≈ 47% of the
  tx memory limit → **N_max ≈ 30–35**. Set `config.batchCap = 16` (safe demo value w/ margin). Numbers
  recorded in `onchain-spec.md` §6 (put on the fee slide). Next-step optimization noted: `Dict` O(1)
  lookups → ~O(n) settlement, higher N_max.

### 1.4 Smoke test on Preprod — SINGLE claim first  ·  🔒(needs funded wallet + Blockfrost)
- ✅ Script address computed from `plutus.json` (`validatorToAddress`, hash-verified) → in `.env.local`.
- ✅ Seed script written: `demo-app/scripts/seed.ts` (`npm run seed`, loads `.env.local`).
- ✅ Single-claim path written: `demo-app/scripts/claim.ts` (`npm run claim`) — claims one Open ticket via
  the real `settleReal` path.
- ✅ **`npm run claim`** ran — claimed 1 ticket on Preprod, tx `0531d1a3…b705` **confirmed** (fee 238,189 lovelace).

### 1.5 Batch settlement on Preprod  ·  🔒(needs funded wallet + Blockfrost)
- ✅ `seed.ts` loops to seed **~10** Open ticket UTXOs (`SEED_TICKETS` env, default 10).
- ✅ Batch redeemer + multi-input collect + **signer/claimant correctness** wired in `settleReal` (adds the
  signer key to `extra_signatories` and uses the wallet key hash as claimant so rule 2 passes).
- ✅ **`npm run seed`** deployed 10 Open tickets (tx `6ff3b50c…7ab3`); **`npm run batch`** settled **5
  tickets in one tx** (tx `9655d2c2…88a7`, fee 593,035 lovelace, ~53% saved). Batch redeemer +
  multi-input collect + state-split confirmed on real chain.

---

## PHASE 2 — Wire real settlement + API routes  ·  ✅ mostly DONE (live submit gated on wallet)

### 2.1 Finish `settleReal`  ·  ✅ DONE (verified sans live wallet)
- ✅ Loads the validator from `plutus.json` and `tx.attach.SpendingValidator(validator)`.
- ✅ `Data.Object` schemas match `types.ak` (owner/item_id/status enum; utxo_ref
  `{transaction_id, output_index}`; claims list) — **round-trip verified**; the validator→address
  **matches** `.env.local` `SCRIPT_ADDRESS` (== Aiken hash).
- ✅ Builds **one `Claimed` output per claim** (rule 6 — state stays split); reads fee from `completed.fee`.
- ✅ `@lucid-evolution/lucid` installed. *Verified:* `tsc`/`next build` clean.
  ⬜ **Remaining:** the actual `tx.complete()`/`sign`/`submit` needs a funded wallet + Blockfrost —
  run it once tickets are seeded (Phase 1.5). *Accept:* `settleReal` returns a real `txHash` + `feeLovelace`,
  tx confirms on Cardanoscan.

### 2.2 API routes  ·  ✅ DONE
- ✅ `app/api/settle/route.ts` (validates body → `settleBatch`, toggle-aware),
  `app/api/congestion/route.ts` (GET score+mode; POST mode/override; `globalThis` singleton predictor),
  and `app/api/settlement-mode/route.ts` (flip real/demo at runtime). *Verified:* `curl` exercised — demo
  settle returns correct fee math; empty batch → 400. Reference code below.

```ts
import { NextResponse } from "next/server";
import { settleBatch } from "@/lib/agent/settlement";
import { config } from "@/lib/agent/config";

export async function POST(req: Request) {
  const body = await req.json();
  // validate BEFORE building a real tx (AGENT.md §4)
  if (!Array.isArray(body.requests) || body.requests.length === 0) {
    return NextResponse.json({ error: "empty batch" }, { status: 400 });
  }
  if (body.requests.length > config.batchCap) {
    return NextResponse.json({ error: "batch exceeds cap" }, { status: 400 });
  }
  const result = await settleBatch(body); // honors SETTLEMENT_MODE
  return NextResponse.json(result);
}
```
Old checklist (kept for reference):
- ✅ `demo-app/app/api/settle/route.ts` — **validate body**, then `settleBatch` (toggle-aware).

```ts
import { NextResponse } from "next/server";
import { settleBatch } from "@/lib/agent/settlement";
import { config } from "@/lib/agent/config";

export async function POST(req: Request) {
  const body = await req.json();
  // validate BEFORE building a real tx (AGENT.md §4)
  if (!Array.isArray(body.requests) || body.requests.length === 0) {
    return NextResponse.json({ error: "empty batch" }, { status: 400 });
  }
  if (body.requests.length > config.batchCap) {
    return NextResponse.json({ error: "batch exceeds cap" }, { status: 400 });
  }
  const result = await settleBatch(body); // honors SETTLEMENT_MODE
  return NextResponse.json(result);
}
```
- ⬜ `demo-app/app/api/congestion/route.ts` — `GET` returns `{ score, mode }`; `POST { mode }` flips the
  toggle, `POST { override }` drives the demo slider (`predictor.setMode` / `predictor.demo.setOverride`).
  Keep a **module-singleton** `CongestionPredictor` (Next dev re-imports — guard with `globalThis`).
  *Accept:* `curl` both routes returns sane JSON in demo mode.

### 2.3 Naive-fee baseline  ·  ✅ DONE
- ✅ Real single-claim fee measured on-chain: **`f1 = 238,189` lovelace** (tx `0531d1a3…`).
  `config.singleClaimFeeLovelace = 238_189` — the "fees saved" counter now uses the real measured baseline.
  Also **fixed the fee reader** in `settleReal` (robust across Lucid/CML shapes; reported fee 593,035 ==
  on-chain fee for the batch tx).

---

## PHASE 3 — Demo UI  ·  ✅ BUILT + VERIFIED IN BROWSER

Stack = ADR-009 · **full structure, state model, and extension points in [`frontend.md`](./frontend.md)**.

> ✅ **Verified live in Chrome** (`npm run start` → localhost:3000): page renders; fired **Heavy contention**
> → pipeline settled **24 claims into 8 batched txs**, **₳3.22 saved** (naive ₳6.00 → batched ₳2.78); drove
> the congestion slider → score **0.82 "CONGESTED"** → longer window; the **contention graph** rendered
> **21 nodes / 63 conflict edges / 3 selected (MIS, green)**. All four required visuals confirmed.
> **Fixes made during verification:** replaced `react-force-graph-2d` (its dynamic chunk broke the prod
> build) with **inline SVG**; added an **`ErrorBoundary`** around panels (AGENT.md §0.1). Root cause of the
> initial blank page was a **stale `next start` process** serving old chunks — see `demo-and-testing.md`.

> _3.1–3.4 below are the file-by-file build list — **all ✅ done and browser-verified**; kept as reference._

### 3.1 Store + primitives + layout  ·  ✅
- ✅ `stores/useBatcherStore.ts` — the Zustand store exactly as in `frontend.md` §4 (queue, graph,
  currentBatch, results, score, scoreHistory, derived totals + actions). Seed it with mock data for now.
- ⬜ `hooks/useInterval.ts` + `lib/format.ts` (lovelace↔ADA, short hash).
- ⬜ `components/ui/` primitives: `Card`, `Button`, `Stat`, `Toggle`, `Badge` (dumb, presentational).
- ⬜ `components/layout/DashboardGrid.tsx` + `Header.tsx`; `app/page.tsx` composes them into two columns
  (**Naive** | **Batcher**). *Accept:* dashboard renders from mock store data, responsive, dark mode works.

### 3.2 Live pieces (mock data)  ·  H1:30–H3:00
- ⬜ `components/requests/RequestStream.tsx` + `RequestCard.tsx` — incoming `UserRequest`s, newest on top.
- ⬜ `components/congestion/CongestionGauge.tsx` + `CongestionSparkline.tsx` (Recharts) — score + the batch
  window it maps to; sparkline of `scoreHistory`.
- ⬜ `lib/engine/graphAdapter.ts` — `ContentionGraph → {nodes, links}` with `chosen`/`conflict` flags.
- ⬜ `components/graph/ContentionGraph.tsx` — **the hero visual.** `react-force-graph-2d` via
  `next/dynamic({ ssr:false })`; chosen MIS nodes green, conflict edges red, deferred muted; legend.
  *Accept:* feeding `buildContentionGraph` + `selectBatch` output renders the graph with the independent
  set highlighted. **Prioritize this — it's the most persuasive visual.**
- ⬜ `components/batch/BatchComposition.tsx` — chosen vs deferred requests for the current cycle.

### 3.3 The money  ·  H3:00–H4:00
- ⬜ `components/fees/BeforeAfter.tsx` — naive tx count + total fee vs batched tx count + total fee.
- ⬜ `components/fees/FeesSavedCounter.tsx` — running total ADA saved (sum of `savedLovelace`), optionally
  Framer-Motion count-up.
- ⬜ `components/fees/SettlementLink.tsx` — Cardanoscan link when `result.mode === "real"`; a `demo`/`real`
  `Badge` on each result (honesty — `frontend.md` §6). *Accept:* a mock `SettlementResult` moves both
  counters and renders the link/badge.

### 3.4 Controls  ·  (overlaps Phase 4)
- ⬜ `components/controls/ModeToggles.tsx` — congestion & settlement real|demo (POST `/api/congestion`,
  flip settlement mode). `Header` hosts the congestion **slider** (demo → POST `{override}`).
- ⬜ `components/controls/LoadGenControls.tsx` — preset buttons (wired in Phase 4).
  *Accept:* toggles flip store/server mode; slider drives the gauge.

---

## PHASE 4 — Loadgen + client pipeline wiring  ·  ✅ DONE + browser-verified

- ✅ **Loadgen** (`lib/engine/loadgen.ts` + `LoadGenControls`): Heavy / Spread / Mixed presets, deterministic
  ids/timestamps (AGENT.md §3). Unit-tested.
- ✅ **Client agent loop** (`hooks/useBatcherEngine.ts`): queue → `buildContentionGraph` → `selectBatch` →
  `POST /api/settle` → update store → re-queue deferred; window length from the congestion score.
  *Verified in browser:* pressing **Heavy contention** drove the whole pipeline (24 → 8 settlements, ₳3.22
  saved) end to end in demo mode with no chain. Also covered by `integration.test.ts`.

---

## PHASE 5 — Integration + real Preprod run + test  ·  ⏱ H4:00–H5:30  ·  ALL

**Protect this window — it's the point of the day.**

- ✅ **Demo-mode integration verified** (`integration.test.ts`): full pipeline loadgen → contention graph
  → MIS → `settleBatch` → re-queue, drains to zero; heavy contention takes many cycles, spread one;
  batched fee < naive fee. API routes exercised via `curl`.
- ✅ **`aiken check` green** (13/13: rules + rejects + benchmark) and **`aiken build` → plutus.json**.
- ✅ Pure-module + integration tests passing (`npm test` → **27 green**).
- ✅ **Real batched settlement done** — `npm run batch` settled 5 tickets in one tx on Preprod
  (`9655d2c2…88a7`, confirmed, real fee 593,035, ~53% saved). Use the **script** for the on-chain money-shot.
  ⚠️ The **UI** "Settlement → real" toggle does NOT yet do a real tx — the loadgen invents fake ticket refs
  (`ticket00#0`) that aren't on-chain; wiring the UI to real UTXOs is a follow-up (see note below).
- ⬜ Flip `CONGESTION_MODE=real` briefly to prove the Blockfrost read works; keep `demo` for the live
  demo (Preprod is idle — drive the slider).
- ✅ **Fallback check** — verified: the entire browser demo ran with `BLOCKFROST_PROJECT_ID` empty (pure
  demo mode, correct fee math, zero chain calls); demo mode has no chain dependency (also `integration.test.ts`).
  The screen never blanks (AGENT.md §0.1), and panels are wrapped in an `ErrorBoundary`.
- ⬜ Reseed fresh Open tickets (`npm run seed`) so the live demo starts clean (needs wallet).

---

## PHASE 6 — Harden & pitch  ·  ⏱ H5:00–H6:00  ·  ALL

- ✅ **Pitch deck built** — `Docs/pitch-deck.html` (9 slides: problem → today → solution → live demo results
  → the numbers/benchmark → positioning → risks → ask), with the **real** figures (24→8 txs, ₳3.22 saved,
  N_max≈30–35, 13/13 + 27/27 tests, validator hash). Published as an Artifact; scroll-snap + arrow-key nav +
  light/dark. Content backed by `pitch-and-risks.md`.
- ✅ **Demo-day runbook** written: [`runbook.md`](./runbook.md) — setup, the exact click-path, recording
  steps, fallback ladder, Q&A cheat-sheet. Turns the human tasks below into a checklist.
- ⬜ Run the full demo **twice** end to end on the actual demo machine/network (human task — see runbook §1–2).
- ⬜ **Record a backup video** of a successful run (human task — runbook §3).
- ⬜ Rehearse the ~2-min script (`runbook.md` §2 / `6hr-sprint.md`). Prep the risk Q&A (`pitch-and-risks.md` §7).
  *Accept:* deck done ✅, demo rehearsed, backup video ready, every risk has an answer.

---

## Dependency graph (what unblocks what)

```
P0 setup ─┬─▶ P1.1 types ─▶ P1.2 validator ─▶ P1.3 tests+N_max
          │                      └─▶ P1.4 single-claim ─▶ P1.5 seed 10 ─┐
          │                                                             ▼
          ├─▶ P2.1 settleReal (needs plutus.json) ─▶ P2.2 API ─▶ P2.3 baseline ─┐
          │                                                                     ▼
          └─▶ P3 UI (mock data) ─────────────────▶ P4 loadgen+loop ─▶ P5 integrate+real ─▶ P6 pitch
```
- **Critical path:** P1.2 → P1.4 → P2.1 → P2.2 → P5. If P1.4 (single-claim smoke) isn't green by
  **H3:00**, drop to the fallback ladder.
- **Independent (absorbs slack):** P3 UI and the pure P2 client pipeline run entirely on mock/demo data.

---

## Fallback ladder (descend only as needed — from `6hr-sprint.md`)

1. **Batch tx not working by H3:30** → ship a **single real claim tx** on Preprod (still "Built on
   Cardano" proof) + simulate the batch in the UI (`SETTLEMENT_MODE=demo`), disclosed.
2. **On-chain fully stuck** → show validator code + `aiken check` passing + the deployed **script
   address** on Cardanoscan; run settlement in demo mode.
3. **Always-true floor:** the client-side demo (graph + congestion + MIS + fee math) runs with zero
   chain access. Never let integration risk break it.

---

## Definition of done (whole project)

A live demo on the actual machine where: a burst of simulated concurrent claims flows through the
adaptive pipeline into a small number of batched settlements; the **congestion score visibly reshapes
batch size**; **at least one real settlement is confirmed on Preprod** (Cardanoscan link on screen); and
a **real, verifiable "fees saved" number** is displayed — pitched as reusable Cardano infrastructure with
its risks named honestly, with a backup video in hand.

---

## Cross-cut checklist (applies to every phase)
- [ ] Demo still runs in `demo` mode with no chain access.
- [ ] Real-chain calls gated behind toggles; failure falls back to demo, never blanks the UI.
- [ ] Settlement keeps state SPLIT (outputs ≥ claims).
- [ ] Secrets server-side only; `.env*` gitignored; Preprod pinned.
- [ ] `/api/settle` validates input before building a real tx.
- [ ] Aiken/Lucid/Blockfrost API names verified against pinned versions.
- [ ] No AI overselling in copy; no AI attribution in commits.
