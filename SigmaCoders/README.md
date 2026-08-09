# 🌾 AgriConnect: AI & Cardano Powered Agricultural Biomass Marketplace

AgriConnect is a decentralized, Web3 SaaS marketplace that bridges the gap between agricultural producers (farmers) and industrial processors (manufacturing plants, paper mills, energy plants). Rather than burning agricultural waste residues (which causes massive seasonal air pollution), farmers sell their waste residues to industries as eco-friendly raw materials.

---

## ⚡ What Problem Are We Trying to Solve?

1. **Agricultural Waste Burning**: Billions of tons of agricultural stubble, rice husk, and stalks are burned annually. This contributes heavily to seasonal air pollution (smog) and greenhouse gas emissions. AgriConnect monetizes this waste, transforming it into valuable industrial feedstocks.
2. **Industrial Supply Chain Trust**: Industries struggle to verify the quality, moisture levels, dry weight, and source of bio-materials. By anchoring AI quality analysis hashes and transaction records to the Cardano blockchain, we ensure 100% supply chain transparency.
3. **Double Counting of Carbon Offsets**: Carbon credit registries are often opaque and prone to double-counting. AgriConnect mints verifiable, non-fungible Green Impact Certificates (NFTs) directly on-chain for every successful biomass purchase checkout.

---

## 🚀 Project Overview & Description

AgriConnect integrates **Gemini AI** for automated visual biomass classification and **Cardano blockchain protocols** to establish cryptographic trust, secure document validation, transaction logs, and mint carbon offset certificates as NFTs.

### Key Features

- **Non-Custodial Web3 Architecture**: Uses CIP-30 Cardano web wallet integration (such as Nami, Lace, or Eternl) to verify user signatures (CIP-8) and authorize smart contract purchase settlements.
- **AI Biomass Analyzer**: Analyzes waste pictures to verify moisture levels, biomass category, carbon savings values, and recommend market price indices.
- **On-Chain Audit Trails**: Anchors all transactions, listings, corporate verifications, and carbon credits allocations directly to the Cardano Preprod testnet.
- **Interactive Visual Explorer**: Features an integrated blockchain ledger block explorer mapping system telemetry in real time.

---

## 🛠️ Tech Stack Used

### Frontend (SaaS Portal)

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4, Vanilla CSS (Design System Tokens)
- **Animations**: Framer Motion (staggered entries, smooth layout indicators)
- **Charts**: Recharts (carbon curves, revenue tracking area graphs)
- **Web3 Integration**: Mesh SDK (`@meshsdk/core` & `@meshsdk/react` CIP-30 wrapper APIs)
- **Icons**: Lucide React

### Backend (SaaS API)

- **Runtime**: Node.js, Express, TypeScript (`tsc`)
- **Database**: MongoDB & Mongoose schemas (caching challenge nonces, explorer txs, listings, and profiles)
- **Cryptography**: Node `Buffer` & Mesh `@meshsdk/core` signature verification
- **Configuration**: ES Modules, `dotenv`

---

## 📸 Project Demo & Screenshots

### 1. The AgriConnect Web3 Hub Dashboard

_Features a premium obsidian dark-mode interface with background mesh ambient glow, floating cards, active navigation tab indicators, and a dual wallet connection/developer sandbox gateway._

![AgriConnect Dashboard](./docs/screenshots/dashboard.png)

### 2. Corporate Marketplace & Biomass Purchase

_Sieve filters, catalog grids, and company document status badges. The checkout compiles live Cardano transactions, prompts user signatures, and tokenizes carbon offset yields._

![AgriConnect Marketplace](./docs/screenshots/marketplace.png)

---

## ⚙️ Getting Started & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas instance)
- Cardano Wallet Extension (e.g. [Nami](https://namiwallet.io/) or [Lace](https://www.lace.io/)) configured on the **Preprod Testnet**.

### Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   BLOCKFROST_API_KEY=your_blockfrost_preprod_api_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

### Setup Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🔗 Live Links & Project PPT

- **Live Project Link**: [Local Development Server](http://localhost:3000) (Configure Preprod ADA in your Lace/Nami wallet extensions)
- **Project Presentation (PPT)**: [AgriConnect_Presentation.pptx](https://gamma.app/docs/AgriConnect-zg97hpwx5lbcrf2)

---

## 👥 Team Members Info

- **Charan D.**
- **Akshay M.**
- **Github**: [@charan-dss-01](https://github.com/charan-dss-01)
