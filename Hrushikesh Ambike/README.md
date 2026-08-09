# Ouro — Self-Repaying, Non-Liquidating Loans on Cardano

**Team:** Hrushikesh Ambike  
**Hackathon:** IndiaCodex 2026  

---

## The Idea in One Sentence

> Your collateral never stops earning. Ouro redirects ADA staking yield to pay off your loan — so debt only ever moves toward zero, and there's nothing to liquidate.

---

## Project Overview

Ouro is a DeFi lending protocol on Cardano where borrowers:
1. **Deposit** tADA as collateral in a personal Plutus V3 vault
2. **Borrow** tUSDM up to their LTV tier limit
3. **Melt** — staking rewards from the locked tADA automatically repay debt each epoch
4. **Repay** manually to build on-chain reputation
5. **Withdraw** collateral once debt reaches zero — no liquidation ever possible

**Key differentiator:** Debt is monotonic — it only ever goes down. There is no oracle-triggered liquidation path in this protocol by design.

---

## Live on Cardano Preprod

| Component | Address / Hash |
|---|---|
| Oracle price feed | `addr_test1wz44fw3pr8af43zaqluv7997j2flgexr3y5j9pajfcujxagdy2s8u` |
| Reputation registry | `a27ee639f7e8253df3861bd376e5258669418f2a76fee568f47f28cc` |
| tUSDM policy | `6cd0726ca1e8856aade946807e644807f7127505bd48c6333e090b4b` |
| Vault validator | Per-owner — derived at runtime from each wallet's key hash |

---

## Repository Structure

```
Hrushikesh Ambike/
├── frontend/                Next.js 16 · React 19 · CIP-30 wallet integration
├── backend/                 TypeScript · Mesh SDK tx builders (off-chain)
├── smart-contracts/         Aiken · Plutus V3 validators (on-chain)
└── OURO_Hackathon_Presentation.pptx
```

### Smart Contracts (`smart-contracts/`)

Written in **Aiken (Plutus V3)**:
- `validators/vault.ak` — Per-owner collateral + debt vault (Borrow/Repay/Harvest/Close)
- `validators/reserve.ak` — tUSDM mint/burn policy
- `validators/oracle.ak` — Signed ADA/USD price attestation
- `validators/reputation.ak` — Non-transferable, validator-linked reputation registry
- `lib/ouro/ltv.ak` — LTV tier math
- `lib/ouro/types.ak` — Shared datum/redeemer types

### Backend (`backend/`)

TypeScript off-chain transaction builders using Mesh SDK:
- `src/tx/deposit-borrow.ts` — Deposit / Borrow / Repay tx builders
- `src/tx/vault-state.ts` — On-chain vault UTxO decoder
- `src/ledger/ltv.ts` — LTV math mirrored 1:1 with the Aiken validator
- `src/price.ts` — Kraken/Coinbase ADA-USD oracle feed
- `src/admin-signer.ts` — Server-only admin co-signer

### Frontend (`frontend/`)

Next.js 16 App Router web application:
- Deposit, Borrow, Repay panels
- Live debt-melt visualization (DebtGauge, PayoffChart)
- Borrower Passport (reputation tier + progress)
- On-chain oracle price polling

---

## Reputation Tiers

| Tier | LTV | Unlocks At |
|---|---|---|
| Bronze | 50% | Default — every new borrower |
| Silver | 65% | 2 loans repaid, ≥ 500 tUSDM cumulative |
| Gold | 80% + credit line | 5 loans repaid, ≥ 2,000 tUSDM cumulative |

---

## Tech Stack

- **On-chain:** Aiken · Plutus V3
- **Off-chain:** TypeScript · Mesh SDK · Blockfrost
- **Web:** Next.js 16 · React 19 · CIP-30 wallet (Eternl/Lace/Vespr)
- **Testing:** Aiken test runner · Vitest · Testing Library (130 tests passing)

---

## Quickstart

```bash
cd frontend
npm install
cp .env.example .env.local
# edit .env.local → BLOCKFROST_PREPROD_PROJECT_ID=<your key>
npm run dev
# → http://localhost:3000
```

For on-chain work:
```bash
cd smart-contracts
aiken check    # run 37 unit tests
aiken build    # recompile plutus.json
```

---

## Presentation

See `OURO_Hackathon_Presentation.pptx` in this folder.

---

## License

Apache-2.0
