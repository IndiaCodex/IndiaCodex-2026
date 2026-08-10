# AGENT.md — Coding-Agent Operating Guide

You are building the **Adaptive Concurrency-Aware Batcher for Cardano** — reusable off-chain batching
infrastructure + an on-chain Aiken settlement validator — for the **IndiaCodex'26 Hackathon, General
Track ("Built on Cardano")**. This file is binding for any AI/human agent writing code here. Read it
fully before your first change. The authoritative specs live in `Docs/` — this guide tells you *how* to
work and points you at *what* governs each area.

> **This is a 6-hour hackathon build, not a 6-month product.** Optimize for a working, demoable,
> honestly-pitched system — not completeness. When a choice trades polish for a working demo, take the
> working demo.

> **Start here:** [`Docs/6hr-sprint.md`](Docs/6hr-sprint.md) (the governing plan) ·
> [`Docs/build-plan.md`](Docs/build-plan.md) (the granular TODO) ·
> [`Docs/architecture.md`](Docs/architecture.md) (system shape) ·
> [`Docs/onchain-spec.md`](Docs/onchain-spec.md) (validator) ·
> [`Docs/offchain-spec.md`](Docs/offchain-spec.md) (agent) ·
> [`Docs/frontend.md`](Docs/frontend.md) (frontend architecture) ·
> [`Docs/cardano-tools.md`](Docs/cardano-tools.md) (which tools we use & why) ·
> [`Docs/decisions.md`](Docs/decisions.md) (ADRs) · [`Docs/glossary.md`](Docs/glossary.md) (vocabulary).

---

## 0. The non-negotiable invariants (memorize these)

1. **The app is REAL-ONLY (settlement is always a real Preprod tx).** *(Updated: the earlier
   demo/real toggle was removed at the user's request — see below.)* The UI is a real batcher console:
   load real on-chain tickets → fire a simulated claim rush against them → settle the non-conflicting
   batch in **one real transaction**. Requires a funded wallet + Blockfrost key. It must **degrade
   gracefully** (clear errors, `ErrorBoundary`, never a blank screen) when the chain hiccups — it does
   not silently fake results. Congestion reads live Blockfrost with a clearly-labeled manual injection
   (Preprod is idle). `settleReal` settles only tickets that still exist on-chain (stale-list safe).
2. **Never collapse batch state into one UTXO.** After a settlement, state STAYS SPLIT — continuing
   script outputs ≥ number of claims (validator rule 6, [`Docs/onchain-spec.md`](Docs/onchain-spec.md) §4).
   Collapsing state re-creates eUTXO contention one block later and defeats the entire project. This is
   the rule Cardano-literate judges look for; it is not optional.
3. **Secrets are server-side only. Preprod only. Test ADA only.** `WALLET_SEED` and
   `BLOCKFROST_PROJECT_ID` never reach the browser bundle — real settlement runs in an API route, never
   client code. Network is **Preprod**; never mainnet, never real funds. Never commit `.env*`.
4. **The Optimizer only ever proposes batches the validator will accept.** All targets `Open`, no
   duplicate UTXO refs, each claimant authorized. The validator is the safety net, not the input filter —
   an on-chain rejection is a bug in the off-chain checks, not normal operation
   ([`Docs/architecture.md`](Docs/architecture.md) §5).
5. **Don't oversell AI.** Congestion prediction is an **EWMA** (a moving average); the optimizer is
   **graph theory** (max independent set). There is no trained model in the MVP and the pitch must not
   claim one. The value is *reusable adaptive infrastructure*, not the algorithms
   ([`Docs/pitch-and-risks.md`](Docs/pitch-and-risks.md) §2).
6. **No browser wallet / CIP-30 in the MVP.** Sign server-side with a seed-phrase wallet. Users are
   simulated; wallet-connect + collateral UX is pure risk you skip (ADR — [`Docs/decisions.md`](Docs/decisions.md)).

If a change would violate any of these, **stop and ask** — do not "work around" them.

---

## 1. Ask, don't assume (the most important behavioral rule)

- When you are **genuinely uncertain** about a design or scope decision, an ambiguous requirement, or
  anything not specified in `Docs/` — **stop and ask the user.** Never invent a number, a policy, a fee
  parameter, a datum field, or a schema and write it as fact.
- **Never hallucinate on-chain facts.** Aiken syntax, stdlib function names, Blockfrost endpoints, and
  Lucid Evolution APIs change between versions — **verify against the pinned version** (`aiken.toml`,
  `package.json`) or the live docs before writing, don't recall from memory.
- Open decisions are tracked as ADRs in [`Docs/decisions.md`](Docs/decisions.md). If your task needs a
  decision that isn't made, ask; don't pick silently.
- When you *do* proceed on a default, say which doc/section you relied on.

---

## 2. Obey the docs exactly

- **The specs are law.** Implement to [`Docs/architecture.md`](Docs/architecture.md),
  [`Docs/onchain-spec.md`](Docs/onchain-spec.md), [`Docs/offchain-spec.md`](Docs/offchain-spec.md),
  [`Docs/fee-economics.md`](Docs/fee-economics.md). Don't redesign mid-task.
- **Timing is governed by [`Docs/6hr-sprint.md`](Docs/6hr-sprint.md)**, not `Docs/roadmap.md` (the
  10-day version is archived). The step-by-step order of work is [`Docs/build-plan.md`](Docs/build-plan.md).
- **If a decision changes, update the governing doc in the same change.** Code and docs never drift. A
  new non-obvious decision gets an ADR in [`Docs/decisions.md`](Docs/decisions.md).
- Cross-reference docs in code comments where it helps a future reader (e.g.
  `// state-split check — onchain-spec.md §4 rule 6`). The off-chain modules already do this.

---

## 3. Ship-quality code within the time budget

This is a hackathon, but the code judges may read must not be embarrassing. Every change ships with:
- **Real error handling on the chain seams** — a failed Blockfrost/submit call falls back to demo mode
  or re-queues the request; it never crashes the loop or blanks the UI. No `catch {}` that hides a
  failure silently *and* leaves the app broken.
- **Input validation at boundaries** — the `/api/settle` route validates its request body before
  building a real transaction. The client never sets a fee amount; the server reads it from the built tx.
- **Types** — strict TypeScript; no `any` on request/chain data you can type. The shared types in
  [`off-chain/src/types.ts`](off-chain/src/types.ts) are the single source of truth.
- **Purity where declared** — `conflictDetector.ts` and `optimizer.ts` stay pure: no I/O, no
  `Date.now()`/`Math.random()` in logic that tests must reproduce. Pass timestamps in via `UserRequest.ts`.
- **A few high-value tests** — see §6. Don't gold-plate coverage; test the correctness paths that a judge
  might probe.

---

## 4. Security & the pre-push gate (scoped to what this project touches)

Triggered areas here: **the wallet seed / Blockfrost key (secrets)**, **the `/api/settle` endpoint
(accepts a request body → builds a real tx)**, and **any dependency add**. Before pushing changes to
these, do a quick vulnerability pass ([`/security-review`](Docs/) is available):
- **Secrets never reach the client.** Confirm `WALLET_SEED` / `BLOCKFROST_PROJECT_ID` are only read in
  server code (API routes / node process), never imported into a client component. `.env*` is gitignored.
- **Validate `/api/settle` input.** Reject malformed batches (bad `utxoRef` shape, empty claims,
  batch larger than `batchCap`) before touching Lucid. Never trust a client-supplied fee or txHash.
- **Preprod guard.** The Lucid provider is pinned to `"Preprod"`; there is no code path that could
  target mainnet.
- **Dependency adds** (`@lucid-evolution/lucid`, graph/UI libs) — pin versions; a quick `npm audit` on
  anything new. No postinstall surprises.
- **No real-value assets** in the demo tickets — Preprod test ADA only.

---

## 5. Toggle discipline (with examples)

Every real-chain capability has a `demo` twin behind a toggle. Business logic calls the **entry point**,
never a mode-specific function directly.

```ts
// ✅ call the toggle-aware entry point — it picks real vs demo
import { settleBatch } from "./settlement";
const result = await settleBatch(batch);        // honors config.settlementMode

// ❌ never hard-wire the real path into the loop
import { settleReal } from "./settlement";
const result = await settleReal(batch);          // breaks the demo the moment Preprod hiccups
```

Same for congestion: the loop reads `predictor.score` / `predictor.windowMs()`; the predictor internally
picks `BlockfrostCongestionSource` (real) or `DemoCongestionSource` (slider/wave) from the toggle. The
loop is identical in both modes — that's the point, and it's what makes the "the policy is real" claim
true. Real settlement is **server-side only** (needs the seed); call it from an API route.

---

## 6. Tests (what to prioritize)

Write tests for the correctness paths a judge might question:
- **Conflict Detector** — mocked requests → exact expected edges; the no-conflict (empty graph) and
  all-conflict (complete graph) extremes.
- **Batch Optimizer** — chosen set is conflict-free, within `cap`, and maximal-ish; "all-conflict →
  exactly 1 chosen", "no-conflict → all up to cap".
- **Congestion** — EWMA output for a known sample sequence; the score→window thresholds (0.3 / 0.7
  boundaries) and clamping to [0,1].
- **On-chain (`aiken check`)** — one `test` per validator rule **including rejection cases**
  (already-`Claimed` input, duplicate `utxo_ref`, unsigned claimant, collapsed output). A validator
  tested only on the happy path will approve a bad batch. Run `aiken check` continuously.

---

## 7. Git & commits

- **Branch-first** — never commit straight to `main` for feature work.
- **Plain commit messages** describing the *why*. **No AI attribution** — no `Co-Authored-By`, no
  "Generated with…" footers, no model names anywhere committed (global rule). Commits must read as the
  team's own work.
- **Never commit secrets** — `.env`, `.env.local`, the wallet seed, the Blockfrost key. `.gitignore`
  must cover them before the first commit.
- Update the governing doc in the same commit when a decision changes.

---

## 8. House style

- **On-chain:** **Aiken**, current `validator {}` block syntax —
  `spend(datum: Option<D>, redeemer: R, own_ref: OutputReference, self: Transaction)`. NOT the old
  `ScriptContext` signature. Verify against the pinned Aiken/stdlib version. Datum/redeemer types in
  `on-chain/lib/batcher/types.ak` must byte-match the `Data.Object` schemas in
  [`off-chain/src/settlement.ts`](off-chain/src/settlement.ts).
- **Off-chain:** **TypeScript** (strict), **Lucid Evolution** for tx building — the npm package
  **`@lucid-evolution/lucid`** (Anastasia Labs), **NOT** the newer `@evolution-sdk/*` (ADR-001,
  [`Docs/cardano-tools.md`](Docs/cardano-tools.md)).
- **Frontend:** one **Next.js (App Router) + TypeScript** app hosting the demo UI + the API routes, with
  **Tailwind + Zustand** (ADR-009, structure in [`Docs/frontend.md`](Docs/frontend.md)). Simulation logic
  runs **client-side**; the single server route `/api/settle` does the real tx. Keep the
  presentational/container split and store slices — don't hardcode; build extendable.
- **Providers are env-driven:** the chain client switches between **Blockfrost** (primary/Preprod),
  **Yaci DevKit** (local devnet, fast iteration), and **Koios** (keyless backup) via `BLOCKFROST_URL`
  alone — no code change (ADR-007, ADR-008).
- **Config & secrets:** everything via env ([`off-chain/.env.example`](off-chain/.env.example)); never
  hardcode keys, addresses, or the seed. Fee params are **fetched live** from Blockfrost
  (`getProtocolParameters`), never hardcoded except as clearly-labeled fallbacks.
- **Money/fees:** integer **lovelace** everywhere (1 ADA = 1,000,000 lovelace); never float ADA in logic.
  Display ADA only at the UI edge.
- **Naming/idioms:** match surrounding code. Keep the pure modules pure; keep the toggles honest.

---

## 9. Quick "is this allowed?" checklist before you write code

- [ ] Does the demo still run fully in `demo` mode with no chain access?
- [ ] Is every real-chain call gated behind its toggle (auto-fallback to demo on failure)?
- [ ] Does the settlement keep state SPLIT (outputs ≥ claims), never collapsed?
- [ ] Are secrets (`WALLET_SEED`, Blockfrost key) server-side only, and `.env*` gitignored?
- [ ] Is `/api/settle` input validated before building a real tx? Preprod pinned?
- [ ] Does the Optimizer only emit batches the validator will accept (Open / no-dup / authorized)?
- [ ] Are the pure modules still pure (no I/O, no `Date.now`/`Math.random` in reproducible logic)?
- [ ] Does the pitch/copy avoid claiming AI/ML we didn't build?
- [ ] Are Aiken/stdlib/Lucid/Blockfrost API names verified against the pinned version, not recalled?
- [ ] Commit has no secrets and no AI attribution?
- [ ] If anything was ambiguous — **did you ask instead of assume?**

If every box is checked (or you asked where unsure), proceed. Otherwise, stop and ask.
