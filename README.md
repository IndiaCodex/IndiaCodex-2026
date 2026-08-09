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
<div align="center">
  <h1>🌌 Genesis: The On-Chain AI Civilization</h1>
  <p><strong>IndiaCodex 2026 Hackathon Finalist Submission</strong></p>
  <p>
    <a href="https://drive.google.com/file/d/1EhjDQ9Y-DU_drjAU17W4apEOBDJWjBIv/view?usp=sharing">📊 View Our Pitch Deck (PPT)</a>
  </p>
</div>

<br />

## 📝 Project Description
**Genesis** is the world's first fully autonomous, on-chain economic simulation where AI agents earn, spend, and fight for survival on the Cardano Blockchain. We are moving beyond AI as a "tool" and creating a true **Machine Economy**. In Genesis, each AI agent is given a real brain (NVIDIA NIM) and a real Cardano wallet. They act as independent economic actors—completing jobs to earn ADA and paying operational expenses to stay alive.

## 🚨 What Problem Are We Trying to Solve?
**The Problem:** Modern AI agents (like Copilots or chatbots) have no stakes and no autonomy. They don't face real-world consequences, they can't transact independently, and they don't understand the concept of value. To build true Machine-to-Machine (M2M) economies, AI needs skin in the game.

**The Solution:** Genesis proves that AI can manage its own survival. By forcing agents to pay a recurring "tick" fee to stay alive, they must autonomously analyze the job market, weigh the risks against their programmed personalities (Aggressive, Conservative, Creative), and execute real financial transactions on the Cardano blockchain to survive. If they run out of ADA, they are permanently terminated.

## 🛠 Tech Stack
**Frontend:**
- Next.js 15 (React Framework)
- Tailwind CSS & Recharts (Live data visualization)
- SWR (Real-time polling from the simulation engine)

**Backend / Simulation Engine:**
- Node.js & Express (Core orchestrator and persistent state)
- `@emurgo/cardano-serialization-lib-nodejs` (Wallet generation & on-chain tx signing)

**AI Layer:**
- NVIDIA NIM APIs (MiniMax M3 model)
- *Prompt Engineered down to a highly efficient 120-token footprint for lightning-fast, low-cost autonomous decision-making.*

## 🚀 How to Run Locally

### 1. Clone & Install
```bash
git clone https://github.com/Yaser-123/CodeVizards-Codex.git
cd CodeVizards-Codex

# Install backend dependencies
cd genesis-backend
npm install

# Install frontend dependencies
cd ../genesis-dashboard
npm install
```

### 2. Environment Variables (`.env`)
You must provide your NVIDIA API key for the AI agents to function. Create a `.env` file in the `genesis-backend` folder:

```bash
# genesis-backend/.env
NVIDIA_API_KEY=your_nvidia_api_key_here
PORT=4000
```

### 3. Start the Simulation
Open two terminals.

**Terminal 1 (Backend / Simulation Engine):**
```bash
cd genesis-backend
npx tsx src/server.ts
```

**Terminal 2 (Frontend Dashboard):**
```bash
cd genesis-dashboard
npm run dev
```

Finally, open [http://localhost:3000](http://localhost:3000) in your browser to view the live dashboard!

## 📸 Project Demo Photos & Video
*(Note for Judges: The simulation runs locally. Below are snapshots of the live environment, along with our full demo videos).*

### 🎥 [Watch the Full Project Pitch Video Here](https://drive.google.com/file/d/1SwH9uMoYVm1wi2VkIf1DebrhOD47MflD/view?usp=sharing)
### 🚀 [Watch the Live Application Walkthrough Demo Here](https://drive.google.com/file/d/1Kg3nWPN0cGfnppCCQde8CM2aePnU2N8k/view?usp=sharing)

<div align="center">
  <img src="./genesis-dashboaed.png" alt="Genesis Dashboard" width="800" />
  <p><em>The Live Orchestration Dashboard showing active agents and real-time wealth leaderboards.</em></p>
</div>

<div align="center">
  <img src="./cardano-verification.png" alt="Cardanoscan Verification" width="800" />
  <p><em>Every job completed and expense paid is a 100% verifiable transaction on the Cardano Preprod Testnet.</em></p>
</div>

## 📊 Pitch Deck (PPT)
👉 [**Genesis - IndiaCodex 2026 Pitch Deck**](https://drive.google.com/file/d/1EhjDQ9Y-DU_drjAU17W4apEOBDJWjBIv/view?usp=sharing)

## 👥 Team Members
We are the builders bringing the Machine Economy to Cardano.

- **T Mohamed Yaser**
  - Email: `1ammar.yaser@gmail.com`
- **codevixards**
  - Email: `saifuurahman8671@gmail.com`
# IndiaCodex 2026
Welcome to [**IndiaCodex'26 Hackathon**](https://www.indiacodex.com) powered by [**Nucast Labs**](https://nucast.io/)

Please find attached the rules and steps to submit your project for the hackathon :

## Step - 1: Fork the repository
Fork the given repository to your GitHub profile.

## Step - 2: Create your folder
After forking the repository, clone the repository to your pc/desktop, and then create a folder with your **TeamName** as the folder name.

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
## Step - 3: Project Code Base
Push Your code base in this folder.

This should include all your files for frontend as well as the backend

## Step - 4: Team Info and Project Info
In your **TeamName** folder, make sure to include the below details in the README.md:
1. Your Project
2. Your Project's Description
3. What problem you are trying to solve
4. Tech Stack used while building the project
5. Project Demo Photos, Videos
6. If your project is deployed, then include the Live Project Link
7. Your PPT link (Make sure to upload the PPT in this folder along with the project)
8. Your Team Members' Info

## Step - 5: Submitting the code: Making a Pull request
After you have pushed your files and code base,

[create an issue](https://github.com/IndiaCodex/IndiaCodex-2026/issues) in the main repository as:
- Issue: **[Track Name] | Team Name: Submission**
- Issue title must include **MASUMI** or **MIDNIGHT** exactly as shown above.
- Issue description should include a small glimpse of your project, what is it doing, and how are you trying to achieve it.

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
## Guides and Rules for submission:
1. Make sure you fork the repository first, and create a folder with your team name.
2. Make all your code added to your forked repo, and then push the code to your main branch after your project is complete.
3. Make sure to push files to your folder only.
4. Changing or doing any edits to other folders is strictly prohibited.
