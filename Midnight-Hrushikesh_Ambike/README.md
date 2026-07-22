# Confidential Proof of Reserves — Rise In Midnight Submission

**Idea (from provided list):** Age / Eligibility Gate
**Framing:** Solvency Eligibility Gate — prove `private liabilities ≤ public reserves` without revealing either the liabilities or the per-customer balances behind them.
**Category:** Confidential DeFi
**Live demo:** https://por-browser.netlify.app

> This file is the judge-facing overview. The full technical README (architecture, all packages, on-chain proof hashes) lives at [`README.md`](README.md). Submission checklist tracking lives at [`packages/por-browser/SUBMISSION.md`](packages/por-browser/SUBMISSION.md).

# Video Recording Link= https://drive.google.com/file/d/15g19PQl2R6uod3vOyZ7dEDgk_aNOmURq/view?usp=drive_link

# Live Demo/Hosted Website = https://por-browser.netlify.app/

# PPT link= https://drive.google.com/file/d/15g19PQl2R6uod3vOyZ7dEDgk_aNOmURq/view?usp=drive_link

## Problem

Every custodian, exchange, or stablecoin issuer asks customers to trust a number they can't verify: "we hold enough to cover what we owe you." FTX proved that number can be a lie for years. Publishing a full balance sheet fixes trust but leaks every customer's balance to the world.

## Solution

A Lace-connected Midnight dApp that proves a **private liability total is ≤ a public reserves snapshot** — the same selective-disclosure shape as an age gate (`prove privateValue ≤ publicThreshold` without revealing `privateValue`). Here `privateValue` is the committed liability total and `publicThreshold` is the custodian's attested Cardano reserves.

Observers only ever learn:

| Observer learns | Observer never learns |
|---|---|
| `solvent` — yes/no | The exact liability total |
| `reservesSnapshot`, `reservesSlot` | Any individual customer balance |
| `liabilitiesRoot` commitment | Leaf salts / Merkle witnesses |
| Custodian `owner` key hash | Custodian's secret key |

## How it proves it

1. Customer liabilities are committed into a **Merkle-sum tree** off-chain — each leaf is a salted commitment (`persistentCommit`), each internal node sums its children.
2. A **Compact ZK circuit** on Midnight takes the tree as a private witness and verifies every node (leaf commitments, node hashes, `parent.sum == left + right`) — it cannot accumulate locally, so a lying tree is caught on a faked sum or a faked hash.
3. The circuit publishes only the root, the reserves snapshot, the slot, and `disclose(rootSum ≤ reserves)`. The liability total never touches the ledger.
4. Real reserves are summed from the custodian's actual Cardano UTXOs via Blockfrost — re-queryable by anyone.
5. The verdict is bridged to Cardano by a relay oracle into an Aiken `por_anchor` validator (inline-datum attestation, oracle-signed, monotonic-slot anti-replay) — a public, timestamped, falsifiable record next to the real reserves.

## Why this pairing (not just "runs on two chains")

- **Cardano must be the asset ledger** — that's the entire credibility argument. Reserves are real, queryable UTXOs, not a number someone typed in.
- **Midnight must be the ZK layer** — without it, "proof of reserves" collapses into publishing a balance sheet.

## Try it live

1. Open https://por-browser.netlify.app
2. Connect Lace or 1AM (Preprod network)
3. Deploy / join the demo circuit and click **Check eligibility**
4. Read the privacy boundary panel — what the proof reveals vs. hides
5. On-chain record (read-only, no wallet needed): see [`README.md#live-on-testnet`](README.md#live-on-testnet) for explorer links and a GraphQL query against the preprod indexer

## Run it locally

```bash
pnpm install
pnpm --filter @por/por-browser dev       # browser dApp on :5175
pnpm --filter @por/por-browser test      # ≥3 tests, currently 5 passing
pnpm --filter @por/por-browser typecheck
```

Full monorepo quickstart (contract build, all package tests, live preprod proof + Cardano anchor commands): [`README.md#quickstart`](README.md#quickstart).

## Tech stack

React + Vite browser dApp · Compact 0.31 (N=8 circuit) · Lace / 1AM wallet connect · Vitest · Aiken (Cardano anchor validator) · Blockfrost (reserves query) · Netlify (demo hosting).

## Trust boundary, stated honestly

Cardano cannot natively re-verify a Midnight ZK proof, so the anchor is a **trusted-oracle attestation**, not trustless settlement — the standard relay-oracle pattern used across the Midnight↔Cardano ecosystem today. The cryptographic guarantee lives entirely in the Midnight proof; Cardano provides the public, timestamped verdict beside the real reserves.

## Where things live

| What | Where |
|---|---|
| Browser dApp (this hackathon's Level 2/3 deliverable) | `packages/por-browser/` |
| Compact circuit + off-chain tree/witnesses | `packages/contract/`, `packages/core/` |
| Cardano reserves query | `packages/reserves/` |
| Relay oracle + Aiken anchor validator | `packages/oracle/`, `packages/validator/` |
| Product proposal (idea write-up) | `packages/por-browser/PRODUCT_PROPOSAL.md` |
| Submission checklist | `packages/por-browser/SUBMISSION.md` |
| Full architecture + on-chain proof hashes | `README.md` |