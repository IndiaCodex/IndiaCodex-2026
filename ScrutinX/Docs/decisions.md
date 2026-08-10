# Architecture Decision Records (ADRs)

The choices that must be made *before* coding, each with a recommendation and the reasoning. These
resolve `Projectidea.md` §11. Mark a decision **Accepted** once the team confirms; until then the
**Recommended** option is the working default so no one is blocked.

Format: Context → Options → **Recommendation** → Consequences.

---

## ADR-001 — Off-chain library: Lucid Evolution vs MeshJS

**Status:** Recommended (pending team confirm)

**Context.** Both are TypeScript libraries for building/signing/submitting Cardano txs against a
CIP-30 wallet and Blockfrost. We must pick exactly one — mixing them causes type/UTXO-management
conflicts. The brief says either works.

**Options.**
- **Lucid Evolution** — lower-level, explicit control over inputs/outputs/redeemers, actively maintained
  successor to the original Lucid. Better fit for hand-crafting a multi-input batch redeemer.
- **MeshJS** — more turnkey, ships React components/hooks that speed up the demo frontend's wallet
  connection and tx status UI.

**Recommendation: Lucid Evolution (`@lucid-evolution/lucid`, Anastasia Labs) for the off-chain agent.**
The agent's core job is building a non-standard **multi-input batch settlement** transaction with a custom
redeemer — precisely where explicit, low-level control pays off. Use **MeshJS's React components in the demo
frontend only** if they speed up wallet-connect UI, keeping the two strictly separated by package (frontend
vs agent) so there's no mixing within one tx-building path.

> **Naming caveat (verified in research — see [`cardano-tools.md`](./cardano-tools.md)):** the tools
> directory now also lists a newer **"Evolution SDK"** (`@evolution-sdk/evolution`, IntersectMBO, pure-TS
> on Effect). That is a *different, newer* package from Lucid Evolution (`@lucid-evolution/lucid`,
> Anastasia Labs). We use the **Anastasia Labs `@lucid-evolution/lucid`** — mature, most examples, and what
> `off-chain/src/settlement.ts` already imports. Evaluate Evolution SDK only *after* the hackathon.

**If the team is more comfortable with MeshJS**, that's an acceptable flip — MeshJS can build the batch
tx too. The only hard rule: **one library per tx-building path, decided on day 1, never mixed.**

**Consequences.** `txBuilder.ts` and `blockfrostClient.ts` bind to the chosen lib's API. Switching later
is a rewrite of those two files — so commit now.

---

## ADR-002 — Demo scenario: ticket-claim vs mini-DEX

**Status:** Recommended (strong)

**Context.** The demo must make eUTXO contention *visible* to judges in minutes and be buildable in the
hackathon window.

**Options.**
- **Limited-drop ticket claim** — N tickets, many concurrent claimers. Contention is instantly legible.
- **Mini order-book DEX** — buy/sell orders batched into one settlement. More impressive, much more
  on-chain logic (matching, partial fills, value movement) to get right.

**Recommendation: ticket-claim for the MVP.** The concurrency problem is self-evident ("20 tickets, 50
people, watch what happens"), the on-chain rules are simple (claim pattern, §onchain-spec), and it fits
the timeline. **DEX is the stretch goal** only if the ticket MVP is done early (`roadmap.md` M7).

**Consequences.** Validator uses the **claim pattern** (output marks ticket `Claimed`, assigns owner).
`UserRequest.kind` is `"claim"`. Keep the conflict predicate pluggable so a swap rule can be added later
without rewriting the graph builder.

---

## ADR-003 — Conflict source: real Cardano mempool vs simulated local queue

**Status:** Recommended (strong)

**Context.** The Conflict Detector needs a stream of pending requests. Should it watch the real chain
mempool or a local queue fed by the demo?

**Findings (verified).** Blockfrost's mempool endpoint **only shows transactions submitted through
Blockfrost**, and Cardano's mempool is **not global** (each node sees a different pending set). So
"watch the real mempool for contention" is both incomplete and unavailable on the free tier in any
reliable way.

**Recommendation: simulated local queue for the MVP.** Requests arrive over HTTP/WS from the demo/load-gen
into an in-memory queue; the Conflict Detector reads that. This is *more* controllable for a live demo
(you can deterministically stage the "everyone wants the same ticket" moment) and avoids a dependency on
an API surface that can't deliver. **Real-mempool detection is a named stretch goal**, honestly disclosed.

**Consequences.** No mempool polling code in MVP. The agent owns the queue. The pitch states real-mempool
integration as a next step, framed as an enhancement, not a missing requirement.

---

## ADR-004 — Reference script optimization: implement now vs state as next step

**Status:** Recommended (either acceptable)

**Context.** Publishing the validator as a reference script lowers per-settlement-tx fees by not
re-embedding bytecode (`onchain-spec.md` §7, `fee-economics.md` §6).

**Recommendation: implement it *if* the core pipeline is working by roadmap M5; otherwise state it as a
next step.** It's a modest amount of work (publish once, reference thereafter) and it strengthens the
fee-savings demo with a second lever. But it is **not** required for a credible pitch — the `minFeeB`
collapse already carries the fee story. Do not let it block the end-to-end demo.

**Consequences.** If implemented: `txBuilder.ts` references a published script UTXO instead of embedding.
If deferred: one bullet on the "next steps" slide.

---

## ADR-005 — No database for the MVP (in-memory queue)

**Status:** Recommended

**Context.** Does the agent need persistence?

**Recommendation: no DB for the MVP.** The request queue is in-memory; a restart loses in-flight requests,
which is fine for a live demo. Adding persistence ("requests survive restart") is a clean, easily-explained
next step. Avoids setup time and a failure surface during the demo.

**Consequences.** `index.ts` holds queue state in memory. If persistence is later wanted, a small SQLite or
Redis layer slots behind the queue interface without touching the pure components.

---

## ADR-006 — Congestion model: EWMA for the MVP (no trained ML)

**Status:** Recommended (strong)

**Context.** The congestion score could be a trained model on historical data or a simple statistic.

**Recommendation: EWMA of block fullness for the MVP.** A few lines, no training data, reacts fast, trivial
to explain, and it's the *right* fidelity for a signal that only nudges a timing window. A trained
regression on historical epoch data is a **stretch goal attempted only after the full pipeline works**.
Over-investing here contradicts the honest positioning ("this is not an ML breakthrough").

**Consequences.** `congestionPredictor.ts` implements EWMA with a config `alpha`. Include a manual
"simulate congestion" override for the demo (Preprod is usually quiet), clearly disclosed as demonstrating
the *policy*.

---

---

## ADR-007 — Dev network: Yaci DevKit (local) for iteration, Preprod for the final settlement

**Status:** Recommended (strong — added after tooling research)

**Context.** Preprod's public faucet can lag and its blocks are ~20s, which makes the seed → claim →
settle loop slow to iterate and rehearse. Research surfaced **Yaci DevKit**: a local Cardano devnet with a
**Blockfrost-compatible API**, a **built-in faucet** (`topup addr 50000`), **sub-second block times**
(`create-node --block-time 0.2 ...`), and reset-in-seconds. See [`cardano-tools.md`](./cardano-tools.md) Tier 2.

**Recommendation: develop and rehearse on Yaci DevKit; do the ONE final "money-shot" settlement on
Preprod** for a public Cardanoscan link. Yaci removes the faucet wait and turns a minutes-long loop into
seconds; Preprod gives judges a verifiable public-testnet transaction. Because `config.ts` reads the API
base URL from env, switching is a `.env` change — **no code change** (`BLOCKFROST_URL` → Yaci's endpoint).

**Consequences.** Add a Yaci setup path to `build-plan.md` Phase 0. Keep Blockfrost/Preprod as the default
for the recorded demo. Bonus: Yaci's controllable block time can drive a *more realistic* congestion signal
than the manual override (still disclose which you used).

---

## ADR-008 — API providers: Blockfrost primary, Koios keyless backup, Maestro for the mempool stretch

**Status:** Recommended

**Context.** A 30–50 request burst can hit Blockfrost free-tier rate limits, and the real-mempool
conflict-detection stretch (ADR-003) needs a provider Blockfrost can't serve well.

**Findings (verified).** **Koios** is free and **keyless** (public tier ~5,000 req/day; 50,000 registered),
Preprod at `https://preprod.koios.rest/api/v0`, with `blocks` / `protocol_parameters` / `address_utxos` /
`submittx`. **Maestro** (free tier, API key, Preprod) offers real **mempool monitoring**.

**Recommendation:**
- **Blockfrost** stays the **primary** provider (our client targets its REST shape).
- **Koios** is the **keyless fallback** for congestion block-reads (spares the Blockfrost rate limit under
  load) and a backup `submittx`. Note: its request/response shapes differ, so it's a secondary reader, not
  a drop-in swap in the 6h build.
- **Maestro** is named as the **concrete enabler of real mempool conflict detection** — a stated next step,
  not built in 6h.

**Consequences.** `.env.example` documents all three base URLs. No MVP code depends on Koios/Maestro; they
are documented options and pitch talking points.

---

## ADR-009 — Frontend stack: Next.js (App Router) + TypeScript + Tailwind + Zustand

**Status:** Recommended (strong)

**Context.** The user asked for the best **extendable React** frontend. We also have a hard constraint: the
real settlement signs with a seed key and **must run server-side** (AGENT.md §0.3), so the frontend can't be
a pure client SPA.

**Options.**
- **Next.js (App Router) + TS** — React framework with first-class **server API routes** (hosts `/api/settle`
  and `/api/congestion`), one-command deploy (Vercel), SSR/CSR flexibility.
- **Vite + React SPA** — simpler, but **no safe server route** for signing → rejected.

**Recommendation: Next.js (App Router) + TypeScript**, with **Tailwind CSS** (styling), **Zustand** (state),
an **inline-SVG contention graph** (no external graph lib — `react-force-graph-2d`'s dynamic chunk broke the
prod build; SVG is verified working), and **Recharts** (congestion/fees history). Full rationale, folder
structure, state model, and extension points in [`frontend.md`](./frontend.md).

**Consequences.** One `demo-app/` Next.js project hosts the UI **and** the API routes; the pipeline's pure
logic runs client-side, only real-chain calls run in API routes. Structure is presentational/container-split
and store-sliced so it extends (multi-dApp routing, WS, persistence) without a rewrite.

---

## Decision summary table

| ADR | Decision | MVP choice |
|---|---|---|
| 001 | Off-chain library | **Lucid Evolution** (`@lucid-evolution/lucid`, Anastasia Labs) for the agent; MeshJS optional in frontend only, never mixed. NOT the newer `@evolution-sdk/*`. |
| 002 | Demo scenario | **Ticket-claim**; DEX = stretch |
| 003 | Conflict source | **Simulated local queue**; real mempool = stretch (via Maestro, ADR-008) |
| 004 | Reference script | Implement if M5 done early, else **state as next step** |
| 005 | Persistence | **In-memory**, no DB |
| 006 | Congestion model | **EWMA**, no trained ML |
| 007 | Dev network | **Yaci DevKit** (local) to iterate; **Preprod** for the final public settlement |
| 008 | API providers | **Blockfrost** primary; **Koios** keyless backup; **Maestro** for the mempool stretch |
| 009 | Frontend stack | **Next.js (App Router) + TS + Tailwind + Zustand** (+ inline-SVG graph, Recharts); see [`frontend.md`](./frontend.md) |
