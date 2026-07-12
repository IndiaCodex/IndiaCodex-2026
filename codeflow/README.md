<div align="center">

# 🤖 IntentAi — AI-Powered Cardano Transaction Terminal

### Team CodeFlow | IndiaCodex Hackathon 2026

[![Cardano](https://img.shields.io/badge/Cardano-Preprod%20%7C%20Mainnet-0033AD?logo=cardano&logoColor=white)](https://cardano.org)
[![Aiken](https://img.shields.io/badge/Smart_Contracts-Aiken-FF6B35)](https://aiken-lang.org)
[![Mesh SDK](https://img.shields.io/badge/Mesh_SDK-CIP--30-6366F1)](https://meshjs.dev)
[![Live Demo](https://img.shields.io/badge/GitHub-Mushtaq6220%2FintentAi-black?logo=github)](https://github.com/Mushtaq6220/intentAi)
[![PPT](https://img.shields.io/badge/Presentation-Google%20Drive-EA4335?logo=google-drive&logoColor=white)](https://drive.google.com/file/d/1zn9u1ae4idtqiDzw_Xcvqjd0xBmjARYk/view?usp=sharing)

> **"Speak your intent. IntentAi builds the transaction."**
> The world's first AI-native DeFi terminal that converts plain English into verified, safe Cardano on-chain transactions.

</div>

---

## 📊 Presentation

**🔗 [View Project PPT on Google Drive](https://drive.google.com/file/d/1zn9u1ae4idtqiDzw_Xcvqjd0xBmjARYk/view?usp=sharing)**

> The full slide deck is available in [`documents/PPT_LINK.md`](./documents/PPT_LINK.md)

---

## 👥 Team

**Team Name:** CodeFlow

| Member | Role |
|--------|------|
| Mohammad Mushtaq | Full Stack Developer + Blockchain Engineer |

---

## 💡 Problem Statement

Using Cardano DeFi today requires deep technical knowledge:
- Copying and verifying long wallet addresses manually
- Understanding UTxO model, datums, and protocol parameters
- Navigating multiple DEX interfaces for swaps
- Managing staking delegation through complex pool browsers

**Regular users are locked out.** Complex interfaces create friction, errors, and vulnerability to scams.

---

## 🚀 Solution — IntentAi

IntentAi is a **natural language to blockchain transaction engine** built on Cardano. Users simply describe what they want:

```
"Send 10 ADA to Alice"          →  Resolves contact, builds & signs transfer
"Swap 50 ADA to USDM"          →  Minswap V2 DEX order with Plutus datum
"Stake ADA to OCEAN pool"      →  Real on-chain delegation via Mesh SDK
"Send 5 ADA to Bob every week" →  Scheduled payment (Aiken smart contract)
```

The AI parses the intent → validates safety → builds the exact transaction → prompts wallet signing. **One sentence. One click. On-chain.**

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🗣️ **NL Intent Parsing** | Google Gemini AI converts plain English to structured tx blueprints |
| 🔒 **6-Layer Safety Validator** | Scam detection, balance checks, address validation before any wallet prompt |
| 💱 **DEX Swap** | Minswap V2 SWAP_EXACT_IN with correct Plutus V2 datum encoding |
| 🏦 **Real Staking** | On-chain delegation to 6 curated validator pools via Mesh SDK |
| 📇 **Named Address Book** | "Send to Alice" → resolves her wallet address from contacts |
| 🎙️ **Voice Input** | Speech-to-text for hands-free intent submission |
| 🔁 **Recurring Payments** | Scheduled ADA transfers enforced by Aiken smart contract |
| 📋 **TX History** | Full on-chain history with Cardanoscan deep links |
| 🔑 **CIP-30 Wallets** | Lace, Eternl, Nami, Yoroi, Flint support |

---

## 🏗️ Architecture

```
User (Plain English)
        │
        ▼
┌───────────────────────────────┐
│   Next.js 16 Frontend         │  Chat Terminal, Staking Page, DeFi
│   Framer Motion + Mesh SDK    │  CIP-30 Wallet Connection
└──────────────┬────────────────┘
               │ Natural Language
               ▼
┌───────────────────────────────┐
│   Node.js + Express Backend   │  Google Gemini AI Intent Parser
│   AI Safety Validator         │  Transaction Plan Builder
│   Minswap Aggregator API      │  Blockfrost Indexer
└──────────────┬────────────────┘
               │ Validated Blueprint
               ▼
┌───────────────────────────────┐
│   Smart Contract Layer        │  intent_escrow.ak (Aiken)
│   Aiken Validators            │  delegation_guard.ak (Aiken)
│   Plutus V2 Datum Encoder     │  recurring_payment.ak (Aiken)
└──────────────┬────────────────┘
               │ wallet.signTx() → wallet.submitTx()
               ▼
        Cardano Blockchain
      (Preprod / Mainnet)
```

---

## 📁 Repository Structure

```
codeflow/
├── frontend/              # Next.js 16 frontend
│   └── src/
│       ├── app/           # Chat, Stake, DeFi, Contacts, History pages
│       ├── components/    # ChatSection, StakingPage, TxHistory, etc.
│       └── context/       # WalletContext, NetworkContext, DashboardContext
│
├── backend/               # Node.js + Express API
│   └── src/
│       ├── services/      # aiService, intentParser, swapService, contactService
│       └── controllers/   # intentController, transactionController, stakingController
│
└── smart-contracts/       # On-chain Cardano contracts ← SEPARATE FILE
    ├── aiken.toml         # Aiken project manifest
    ├── validators/
    │   ├── intent_escrow.ak        ← Aiken smart contract
    │   ├── delegation_guard.ak     ← Aiken smart contract
    │   ├── recurring_payment.ak    ← Aiken smart contract
    │   ├── minswapV2Datum.js       # Plutus V2 datum builder (off-chain)
    │   ├── stakingPools.js         # Pool registry
    │   └── intentValidator.js      # Safety validation layer
    └── README.md          # Smart contracts documentation
```

---

## 🔗 Smart Contracts

Smart contract code is located in **`smart-contracts/validators/`** — separate from frontend and backend.

### Aiken Validators (`.ak` files)

**`intent_escrow.ak`** — AI Intent Escrow
- Locks ADA when an intent is submitted
- Receiver claims with signature + AI confidence ≥ 70
- Sender reclaims if deadline passes

**`delegation_guard.ak`** — Staking Delegation Guard
- Only allows delegation to IntentAi-whitelisted pool IDs
- Rejects unknown or malicious pools
- Platform operator can update whitelist on-chain

**`recurring_payment.ak`** — Scheduled Payment Validator
- Enforces payment schedules (daily/weekly/monthly)
- Locks total budget on-chain, releases per epoch window
- Sender can cancel and reclaim at any time

### Off-chain Plutus Datum Builders (`.js` files)
- `minswapV2Datum.js` — Encodes Minswap V2 `SWAP_EXACT_IN` OrderDatum
- `intentValidator.js` — 6-rule safety validation layer
- `stakingPools.js` — Curated pool registry with ticker resolution

---

## 🛠️ Setup & Run

### Backend
```bash
cd backend
npm install
# Create .env with GEMINI_API_KEY, MONGODB_URI, BLOCKFROST_API_KEY, CARDANO_NETWORK=preprod
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
npm run dev
# Runs on http://localhost:3000
```

---

## 🌐 Live Repository

**Full codebase:** [github.com/Mushtaq6220/intentAi](https://github.com/Mushtaq6220/intentAi)

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, Framer Motion |
| Blockchain | Mesh SDK, CIP-30 |
| AI Engine | Google Gemini API |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Smart Contracts | **Aiken**, Plutus V2 |
| DEX | Minswap V2 |
| Indexer | Blockfrost API |

---

<div align="center">

**Team CodeFlow — IndiaCodex Hackathon 2026**
*Speak your intent. IntentAi does the rest.*

</div>
