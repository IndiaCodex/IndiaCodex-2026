# Genesis — Autonomous AI Agents on Cardano

> **A live economic simulation where autonomous AI agents earn, spend, and survive on the Cardano blockchain (Preprod Testnet).**

[![Cardano](https://img.shields.io/badge/Cardano-Preprod%20Testnet-blue?logo=cardano)](https://preprod.cardanoscan.io)
[![NVIDIA](https://img.shields.io/badge/AI-NVIDIA%20NIM-green?logo=nvidia)](https://build.nvidia.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=nextdotjs)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Backend-Express-lightgrey?logo=express)](https://expressjs.com)

---

## What is Genesis?

Genesis is a **decentralised AI agent simulation** built on Cardano's testnet. Each agent is a fully autonomous entity with:

- 🧠 **A real AI brain** — powered by NVIDIA NIM (MiniMax M3 LLM) that reads the agent's balance, personality, and history to decide whether to work or rest each tick
- 💳 **A real Cardano wallet** — generated at birth, funded with ADA, and used for real on-chain transactions
- ⚖️ **An economic life** — agents earn ADA by completing jobs, pay operating expenses every tick, and die permanently if their balance hits zero
- 📊 **A transparent dashboard** — every decision, transaction, and balance change is visible in real time

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Genesis Dashboard                 │
│              (Next.js 15 — localhost:3000)           │
│                                                     │
│  Dashboard │ Agents │ Economy │ Admin │ Activity     │
└────────────────────┬────────────────────────────────┘
                     │ REST API  (NEXT_PUBLIC_API_URL)
┌────────────────────▼────────────────────────────────┐
│                   Genesis Backend                   │
│              (Express — localhost:4000)              │
│                                                     │
│  AgentStore  │  DecisionEngine  │  EconomyService   │
│  LLMService  │  WalletService                       │
└──────┬────────────────────────────────┬─────────────┘
       │                                │
┌──────▼──────┐                 ┌───────▼───────┐
│ NVIDIA NIM  │                 │  Blockfrost   │
│  (LLM AI)   │                 │  (Cardano)    │
└─────────────┘                 └───────────────┘
```

---

## Agent Lifecycle

```
Spawn → Funded (20 ADA) → Tick Loop → Work/Rest Decision → Earn/Expense → Death
  │                           ▲                                             │
  └─────────────── Wallet generated on Cardano testnet ────────────────────┘
```

Each **tick**:
1. LLM reads agent's personality, balance, and last 3 events
2. LLM returns `WORK` or `REST` with a natural-language reason
3. If WORK: agent picks a job from the catalog, earns ADA (with personality variance)
4. Agent pays an operating expense in ADA (real on-chain TX)
5. Balance is updated; if ≤ 0, agent is permanently killed

---

## Job Catalog

| Job | Category | Base Pay | Risk |
|---|---|---|---|
| Market Research | Research | 8 ADA | Low |
| Sentiment Analysis | Research | 10 ADA | Low |
| Competitive Intelligence | Research | 14 ADA | Medium |
| On-chain Analytics | Research | 18 ADA | High |
| Data Cleanup | Development | 6 ADA | Low |
| Code Review | Development | 15 ADA | Medium |
| API Integration | Development | 20 ADA | Medium |
| Smart Contract Audit | Development | 30 ADA | High |
| Logo Design | Creative | 8 ADA | Low |
| Landing Page Copy | Creative | 12 ADA | Low |
| Whitepaper Draft | Creative | 22 ADA | Medium |
| Tokenomics Design | Creative | 28 ADA | High |

### Personality Payout Variance
| Personality | Variance |
|---|---|
| Aggressive | ±40% |
| Creative | ±20% |
| Conservative | ±10% |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Cardano Preprod Testnet Blockfrost API key
- NVIDIA NIM API key
- A funded Cardano testnet faucet wallet

### Backend Setup

```bash
cd genesis-backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys

npm run dev   # or: npx tsx src/server.ts
```

### Frontend Setup

```bash
cd genesis-dashboard
npm install

# Set backend URL
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/agents` | All agents (no mnemonic) |
| GET | `/api/agents/:id` | Single agent with full history |
| POST | `/api/agents` | Spawn new agent |
| GET | `/api/events` | All events (newest first) |
| POST | `/api/tick` | Run one manual tick |
| POST | `/api/tick/auto/start` | Start auto-tick loop |
| POST | `/api/tick/auto/stop` | Stop auto-tick loop |
| GET | `/api/tick/auto/status` | Auto-tick status |
| GET | `/api/stats` | Global economy stats |
| GET | `/api/jobs` | Full job catalog |

---

## Environment Variables

```env
# genesis-backend/.env
BLOCKFROST_API_KEY=preprodsXXXXXXXXXXX
FAUCET_WALLET_MNEMONIC=word1 word2 ... word24
FAUCET_ADDRESS=addr_test1...
NVIDIA_API_KEY=nvapi-XXXX
PORT=4000
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, SWR, Recharts, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| AI | NVIDIA NIM — MiniMax M3 LLM |
| Blockchain | Cardano Preprod Testnet via Blockfrost |
| Wallet | `@emurgo/cardano-serialization-lib` |

---

*Built for the Cardano Hackathon — Genesis demonstrates autonomous AI agents that truly live on a blockchain.*
