<div align="center">

# uniperp

### Perpetual futures you can't front-run — not even the operator can.

**Team Goose · IndiaCodex 2026 · powered by Nucast Labs**

Privacy-preserving perpetual futures on **Cardano** + **Midnight**. Your order is a zero-knowledge commitment *and* a drand-timelock ciphertext, so the mempool, MEV bots, other traders — **and the exchange operator itself** — never see it coming.

`ADA · BTC · ETH · SOL · DOGE` · up to 20× · dUSD-margined · settled + audit-anchored on Cardano

</div>

---

## 1. The Project

**uniperp** is a privacy-first perpetual-futures DEX. It fuses a premium perps trading terminal with a zero-knowledge privacy layer so that order flow is invisible to front-runners — and, uniquely, invisible to the operator running the exchange until it's too late to act on it. (The build/demo is branded **"dorr"** — same project.)

## 2. Description

You commit an order as a **SHA-256 commitment on Midnight** (ZK proof of validity) *and* **timelock-encrypt it to a future drand round**. The public sees only a 32-byte hash; the operator holds only ciphertext. Orders settle in **uniform-price batch auctions**, execute against an oracle-priced virtual AMM (Pyth), and every settlement digest + sealed-batch membership is **anchored on Cardano L1**. Collateral lives in a **non-custodial vault** — only *you* can move it.

**What makes it different — every one of these is proven live on-chain, no mocks:**

| The operator **can't**… | How | Proof |
|---|---|---|
| **see** your order | drand timelock — it holds only ciphertext until the batch freezes | decrypt refused live (`"too early — decryptable at round N"`) |
| **front-run** you | uniform-price batch clearing — a sandwich nets $0 | live: `$0.00` vs `$152` on a sequential venue |
| **seize** your funds | non-custodial `owner_vault` — only the depositor can spend | operator's withdrawal **REJECTED on-chain**; user self-withdraws ([`81ecf30f…`](https://preprod.cardanoscan.io/transaction/81ecf30f57d2e333317e546406344ff53297b2f95582ec74a5a92e0deeef8f5c)) |
| **hide** which orders were in an epoch | Cardano L1 batch-membership anchor | [`742dc0a9…`](https://preprod.cardanoscan.io/transaction/742dc0a9e65afa5bce8cfa04569a6f8c2fe21a73351215acc64d2955b6466350) |
| **trade as** you | CIP-8 wallet-signature auth | tested (real signer round-trip) |

Plus: private limit orders, hidden stop-loss/take-profit (no stop-hunting), selective disclosure to a chosen auditor, proof-of-solvency, an oracle-divergence guard, CIP-68 position NFTs, a built-in MEV **Attack Lab** (run a sandwich, watch it fail), and **79 automated tests** (11 of them against the *live* drand network).

## 3. The Problem We Solve

On every public perp DEX your order sits in the mempool before it executes. Searchers read it, trade ahead of it, and **sandwich you** — a structural timing tax that's brutal on leverage. Existing "private" DEXs hide orders from the public but the **operator/sequencer still reads them**, so you're just trusting it not to front-run you.

uniperp removes the operator from the trust equation for the two things that matter most:
- **Confidentiality** — the operator is *cryptographically blind* (drand timelock) until the batch is frozen, so it can't trade ahead of you; and uniform-price clearing means ordering carries no profit even if it could.
- **Custody** — a non-custodial vault means the operator *cannot seize your collateral* (proven on-chain: its withdrawal attempt is rejected).

## 4. Tech Stack

- **Cardano** — Aiken (Plutus V3) validators: dUSD sig-policy, **non-custodial `owner_vault`**, operator margin vault, settlement anchor · Lucid Evolution · CIP-30 wallet · CIP-68 position NFTs · preprod
- **Midnight** — Compact zero-knowledge contracts (order commitment, matching, settlement, liquidation, aggregate) + a proof-server pipeline
- **drand timelock** — `tlock-js` (IBE over BLS12-381) against the **League of Entropy** quicknet — the external threshold committee that makes a single operator provably blind
- **Oracles** — Pyth Hermes (off-chain price feeds) → oracle-priced vAMM (constant-product)
- **Frontend** — Next.js 14 · TypeScript · Tailwind · Mesh + Lace wallet · TanStack Query · lightweight-charts
- **Backend** — Bun · Hono operator service · vAMM executor · margin/funding/liquidation keepers · uniform-price sealed-bid batch auction
- **Auth** — CIP-8 wallet signatures (`cardano-verify-datasignature`)

## 5. Demo — Video & Screenshots

**▶️ 60-second launch film:** [`demo/uniperp-launch.mp4`](./demo/uniperp-launch.mp4)

<video src="https://github.com/Praharika267/IndiaCodex-2026/raw/main/Goose/demo/uniperp-launch.mp4" controls width="100%"></video>

> If the inline player doesn't load in your browser, **[click here to watch/download the demo video](https://github.com/Praharika267/IndiaCodex-2026/raw/main/Goose/demo/uniperp-launch.mp4)**.

The premium trading terminal, the **Attack Lab** (a live MEV sandwich failing on uniperp), and the **Sealed** tab (the operator's decrypt refused live by drand) are all in the app — no wallet needed for the demos.

## 6. Live Project Link

Not publicly hosted (Cardano **preprod** testnet + a local Midnight proof network). Run it locally in two commands — see [`RUNBOOK.md`](./RUNBOOK.md):

```bash
bun install
./tools/scripts/dev.sh operator   # operator API
./tools/scripts/dev.sh web         # trading terminal → http://localhost:3000
```

**Verifiable on-chain (Cardano preprod, live):** deposit, faucet, CIP-68 NFT, settlement anchor, sealed-batch membership anchor, and the **non-custodial self-withdraw** are all real, confirmed transactions — hashes + explorer links in [`RUNBOOK.md`](./RUNBOOK.md) and [`docs/SECURITY.md`](./docs/SECURITY.md).

## 7. Pitch Deck (PPT)

**📊 [`uniperp-pitch.pptx`](./uniperp-pitch.pptx)** (uploaded in this folder).

## 8. Team

- **Team:** Goose
- **Submitted by:** [@Praharika267](https://github.com/Praharika267)
- **Project repo (full history):** development happened at `github.com/nickthelegend/dorr`; the complete codebase is included here.

---

## Repository map

| Path | What |
|---|---|
| [`apps/web`](./apps/web) | Next.js trading terminal (wallet + operator API) |
| [`services/operator`](./services/operator) | 5 markets on Pyth, vAMM executor, **sealed-bid batch auction (drand)**, margin/funding/liquidation, Cardano tx layer, MEV attack lab |
| [`packages/engine`](./packages/engine) | off-chain perps engine + order commitment scheme |
| [`packages/contracts-aiken`](./packages/contracts-aiken) | **Smart contracts** — dUSD policy · operator margin vault · **non-custodial `owner_vault`** · settlement anchor (Plutus V3). See [`SMART_CONTRACTS.md`](./SMART_CONTRACTS.md) |
| [`vendor/zkperps/contract/src`](./vendor/zkperps/contract/src) | **Midnight Compact** ZK circuits (order/matching/settlement/liquidation/aggregate) |
| [`docs/`](./docs) | [architecture](./docs/ARCHITECTURE.md) · [features](./docs/FEATURES.md) · [Midnight↔Cardano](./docs/MIDNIGHT_CARDANO.md) · [API](./docs/API.md) · [**security & honest scope**](./docs/SECURITY.md) · [testing](./docs/TESTING.md) |

## Honest scope (we say exactly what's trusted)

uniperp is a **trusted-operator v1** for *clearing correctness* — the operator computes the uniform price off-chain (auditable + L1-anchored, not yet ZK-proven). But it is **already non-custodial** (your funds), **operator-blind** (your order), and **anti-front-running by construction** (uniform-price batches) — all proven live on-chain. The path to *fully* trustless (an Aiken settlement validator + a ZK-proven clearing circuit) is mapped in [`docs/SECURITY.md`](./docs/SECURITY.md). We pitch exactly what's true.

<div align="center"><sub>Built for IndiaCodex 2026 by <b>Team Goose</b> · Cardano × Midnight × drand</sub></div>
