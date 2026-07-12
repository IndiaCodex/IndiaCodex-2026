<!--
  ============================================================================
  INDIACODEX'26 SUBMISSION README  (draft)

  This is the submission-format README required by IndiaCodex/IndiaCodex-2026.
  When submitting:
    1. Fork IndiaCodex/IndiaCodex-2026
    2. Create a folder named after your team, e.g.  <YourTeamName>/
    3. Copy the whole project (on-chain/, off-chain/, demo-app/, Docs/) into it
    4. Rename THIS file to README.md inside that folder, and add your PPT file
    5. Fill in every  «PLACEHOLDER»  below, then delete these comment blocks.
  ============================================================================
-->

# Adaptive Concurrency-Aware Batcher for Cardano

**Team:** ScrutinX
**Event:** IndiaCodex'26 Hackathon (powered by Nucast Labs) · **Track:** General — *Built on Cardano*
**Network:** Cardano Preprod testnet (test ADA only)
**Repository:** https://github.com/vikranthsai310/Cardano-hackathon

---

## 1. The project

**Reusable, adaptive batching infrastructure for Cardano** — an off-chain agent plus an on-chain Aiken settlement validator. It detects which pending user requests collide over the same UTXO, reads live network congestion, and settles the largest non-conflicting set of requests in **one real on-chain transaction** — cutting failed transactions and fees.

## 2. Project description

Under Cardano's eUTXO model, a UTXO can be spent by only one transaction at a time, so many users hitting the same contract state collide and fail. Our system fixes this at the application/infrastructure layer with a four-part pipeline:

1. **Conflict Detector** — builds a *contention graph* of pending requests (edge = same target UTXO).
2. **Congestion Predictor** — an **EWMA** of live Cardano block fullness → a congestion score in `[0,1]`.
3. **Batch Optimizer** — solves a **Maximum Independent Set** on the graph to pick the largest conflict-free batch, and uses the congestion score to size the batch window (congested → wait, batch big; quiet → clear fast).
4. **On-chain Aiken validator** — authorizes the batch settlement in one transaction and enforces the **state-splitting invariant**: after settlement, state stays split across many UTXOs (continuing outputs ≥ number of claims) so the *next* batch doesn't re-collide on one UTXO.

The demo is a **limited-drop ticket-claim** console: it loads real Open ticket UTXOs from the contract, fires a simulated claim rush against them, and settles the non-conflicting winners in **one real Preprod transaction** with a verifiable Cardanoscan link and a live "fees saved" counter.

> **Honest framing (part of our pitch):** this is *not* an AI/ML breakthrough. Conflict detection is graph theory; congestion prediction is a moving average. The value is **reusable adaptive infrastructure + adaptive policy** — the shared batching layer every eUTXO dApp currently rebuilds from scratch (cf. ERC-4337 bundlers, CoW Protocol solvers).

## 3. The problem we are solving

Cardano's eUTXO model is its most-cited scaling friction: concurrent users competing for the same contract UTXO have their transactions **fail on-chain** instead of executing in parallel. Every serious protocol (Minswap, SundaeSwap, …) has built its own bespoke, **static** off-chain batcher to work around this. There is **no shared, reusable, congestion-aware batching layer** — so teams reinvent it, and static batchers waste throughput when quiet and fail/overpay when congested.

**We build that missing layer:** adaptive infrastructure any Cardano dApp can plug into, that resolves contention off-chain *and* preserves on-chain concurrency for the next batch.

**Quantifiable proof (measured on Preprod, not estimated):** a single claim tx costs ~238,189 lovelace; batching 5 claims in one tx measured ~593,035 lovelace → **~53% fees saved** vs 5 separate claims, because the flat per-tx fee (`minFeeB ≈ 0.155 ADA`) is paid **once per batch**, not once per user.

## 4. Tech stack

| Layer | Technology |
|---|---|
| On-chain validator | **Aiken** (Plutus V3; `aiken v1.1.23`, stdlib `v3.1.0`) |
| Off-chain tx building | **Lucid Evolution** (`@lucid-evolution/lucid`, TypeScript, strict) |
| Chain data / indexing / submit | **Blockfrost API** (Preprod); URL-swappable to Yaci DevKit / Koios |
| Frontend | **Next.js 14 (App Router)** + **React 18** + **TypeScript** |
| UI / state / charts | **Tailwind CSS** · **Zustand** · **Recharts** |
| Algorithms | Contention graph + greedy **Maximum Independent Set**; **EWMA** congestion score |
| Testing | **Vitest** (off-chain) · `aiken check` (on-chain, incl. reject-case tests + batch benchmarks) |
| Network | **Cardano Preprod testnet** (test ADA only; server-side seed-wallet signing) |

## 5. Demo — photos & video

**▶ Demo video:** https://drive.google.com/file/d/1QjhFBMEhw-VGWHVyT1qQqgPqNn5fgwBd/view?usp=sharing

<!-- Optional: drop screenshots into a ./demo/ folder and reference them, e.g.:
  ![Batcher console](./demo/console.png)
  ![Contention graph + batch composition](./demo/graph.png)
  ![On-chain proof cards (Cardanoscan links)](./demo/onchain-proof.png)
-->

**What the demo shows:** real Open tickets loading from the contract → a simulated claim rush → the contention graph and chosen batch (Maximum Independent Set) → **one real Preprod settlement** with a live Cardanoscan link and a real "fees saved" number.

## 6. Live project link

**Local-only** (the app signs real Preprod transactions with a server-side seed wallet, so it runs locally rather than as a public deployment).

**Run it locally:**
```bash
# 1) Build the on-chain validator
cd on-chain && aiken build          # produces plutus.json
aiken check                         # run validator tests + batch benchmarks

# 2) Configure secrets (server-side only; never commit)
cd ../demo-app
cp .env.example .env.local
#   set BLOCKFROST_PROJECT_ID (Preprod), WALLET_SEED (funded 24-word mnemonic),
#   and SCRIPT_ADDRESS (from plutus.json)

# 3) Seed ticket UTXOs, then run
npm install
npm run seed                        # mints Open ticket UTXOs at the script address
npm run dev                         # http://localhost:3000
```
In the UI: **Refresh tickets → pick a load preset → Settle** → the on-chain proof card links to the real transaction on Cardanoscan (Preprod).

## 7. Pitch deck (PPT)

**Slides:** https://docs.google.com/presentation/d/1c0Wi2kVXDKgKpjQtwJc4StHBB5wTQmdr/edit?usp=sharing&ouid=103919520367131441281&rtpof=true&sd=true

*(Also upload the `.pptx` file into this team folder, as required by the submission rules.)*

## 8. Team — ScrutinX

| Name | GitHub | Contact |
|---|---|---|
| Vikranth Sai | [@vikranthsai310](https://github.com/vikranthsai310) | 8555856366 |
| Jahwanth | — | 9966715799 |
| Sandeep Swaraj | — | 9398620430 |

---

## Repository structure

```
ScrutinX/
├── README.md          # this file (submission overview)
├── TECHNICAL.md       # full technical write-up (architecture, validator, fee math, risks)
├── ScrutinX.pptx      # pitch deck (upload the PPT file here)
├── on-chain/          # Aiken validator (batch_settlement.ak) → aiken build → plutus.json
├── off-chain/         # reference agent modules (conflict detector, congestion, optimizer, settlement)
├── demo-app/          # Next.js app: UI + API routes + a live copy of the agent
└── Docs/              # full specs: architecture, on/off-chain, fee economics, pitch & risks
```

For the full technical write-up (architecture diagrams, validator rules, fee math, risks & roadmap), see **[`TECHNICAL.md`](./TECHNICAL.md)** and the **[`Docs/`](./Docs/)** folder.

---

*Built for the Cardano IndiaCodex'26 Hackathon · Preprod testnet · test ADA only.*
