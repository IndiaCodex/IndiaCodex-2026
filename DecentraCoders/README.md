# LaunchNest — Powered by Cardano

> **Hackathon**: India Codex'26 | **Team**: DecentraCoders | **Track**: Blockchain / Web3

<!-- SUBMISSION METADATA — DO NOT REMOVE -->
<!-- Team Name: DecentraCoders -->
<!-- Project Name: LaunchNest -->
<!-- Hackathon: India Codex'26 -->
<!-- Track: Blockchain Innovation -->
<!-- Network: Cardano Preview Testnet -->
<!-- Smart Contract Language: Aiken -->
<!-- SDK: Mesh SDK + Blockfrost -->
<!-- Frontend: Next.js 14 + TypeScript + Tailwind CSS -->
<!-- Database: Supabase PostgreSQL -->
<!-- Demo Mode: Fully functional without wallet -->

---

## 🚀 What is LaunchNest?

LaunchNest is a **student startup ecosystem** where ideas are protected, teams are built, and journeys are tracked — all powered by Cardano blockchain.

Every startup idea submitted on LaunchNest gets:
1. A **cryptographic SHA-256 fingerprint** (canonical hash)
2. **Registered on Cardano** via an Aiken smart contract
3. A **blockchain proof certificate** with a permanent, verifiable TX hash
4. A **full ecosystem** to find mentors, recruit developers, and track milestones

---

## 🎯 The Problem

Indian engineering students generate thousands of innovative startup ideas at hackathons, classrooms, and incubators — but have **no affordable, immediate mechanism** to prove ownership. Patent filing takes years and costs thousands of rupees. Without cryptographic proof, ideas get copied with zero recourse.

---

## ✅ The Solution

LaunchNest creates an **immutable proof-of-existence** for startup ideas using:
- **SHA-256 hashing** — deterministic canonical fingerprint
- **Aiken smart contract** — validates hash integrity + owner signature on Cardano
- **Cardano Preview Testnet** — permanent, public, tamper-proof ledger
- **Blockchain certificate** — shareable, printable, CardanoScan-verifiable

---

## 🗂️ Repository Structure

```
DecentraCoders/
├── smart-contract/                 # Aiken Plutus validator
│   ├── aiken.toml                  # Project configuration
│   ├── lib/
│   │   └── types.ak                # Datum + Redeemer type definitions
│   ├── validators/
│   │   └── idea_proof_registry.ak  # Main validator logic
│   ├── tests/
│   │   └── idea_proof_registry_test.ak  # Unit tests
│   └── plutus.json                 # Compiled blueprint
│
├── supabase/
│   ├── migrations/
│   │   └── 20260712000000_init.sql # DB schema (profiles, ideas, records, milestones)
│   └── seed.sql                    # 15 mock users (5 students, 4 mentors, 6 devs)
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Landing page
│   │   ├── login/page.tsx          # Auth page
│   │   ├── register/page.tsx       # Registration
│   │   ├── dashboard/page.tsx      # Role-aware dashboard
│   │   ├── submit-idea/page.tsx    # Idea submission wizard
│   │   ├── idea/[id]/page.tsx      # Idea detail view
│   │   ├── certificate/[id]/page.tsx  # Blockchain certificate
│   │   ├── verify-idea/page.tsx    # Hash verification console
│   │   ├── explore/page.tsx        # Public ideas directory
│   │   ├── mentors/page.tsx        # Mentor discovery
│   │   ├── developers/page.tsx     # Developer recruitment
│   │   ├── team-workspace/page.tsx # Kanban collaboration board
│   │   ├── milestones/page.tsx     # Startup roadmap tracker
│   │   ├── profile/page.tsx        # Profile settings
│   │   └── admin/page.tsx          # Admin console
│   │
│   ├── components/
│   │   ├── DashboardLayout.tsx     # Shell with sidebar, navbar, toasts
│   │   ├── Navbar.tsx              # Top navigation
│   │   ├── Sidebar.tsx             # Role-aware sidebar
│   │   ├── WalletConnect.tsx       # CIP-30 wallet button
│   │   ├── CardanoRegisterModal.tsx  # TX build + sign + submit flow
│   │   └── BlockchainCertificate.tsx # Printable proof certificate
│   │
│   └── lib/
│       ├── hashing.ts              # SHA-256 canonical hash generator
│       ├── cardano.ts              # Mesh SDK TX builder + Blockfrost
│       ├── supabase.ts             # DB service (real + localStorage mock)
│       └── demoData.ts             # TypeScript types + mock seed data
│
├── docs/
│   ├── architecture.md             # System design + DB schema
│   ├── cardano-integration.md      # Smart cont## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- A CIP-30 Cardano browser wallet (Lace, Eternl, or Nami) — for live transactions only

### Run in Demo Mode (no credentials needed)
```bash
git clone https://github.com/decentracoders/launchnest.git
cd DecentraCoders
npm install
npm run dev
```
Open `http://localhost:3000`. Login as **"Demo Student (Rohan Sharma)"** — no wallet or API keys required.

---

## 🔑 Full Cardano Setup (Required for Real Transactions)

### Step 1 — Get Blockfrost Preview API Keys

> Blockfrost is the Cardano API provider that lets your app read/write to the blockchain.

1. Go to **[https://blockfrost.io](https://blockfrost.io)** → Sign up for a free account
2. Click **"Add Project"**
3. Set **Name**: `LaunchNest Preview`
4. Set **Network**: `Cardano Preview` ← IMPORTANT: must be Preview, not Mainnet
5. Click **Create**
6. Copy the **Project ID** — it starts with `preview...`

### Step 2 — Configure `.env.local`

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
# Both variables must use the SAME Preview project ID
BLOCKFROST_PROJECT_ID=previewYOURKEYHERE
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=previewYOURKEYHERE

CARDANO_NETWORK=preview
NEXT_PUBLIC_CARDANO_NETWORK=preview

# Optional — leave empty to run in localStorage Demo Mode
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> ⚠️ **Security**: `BLOCKFROST_PROJECT_ID` (no `NEXT_PUBLIC_` prefix) is ONLY used in server-side API routes and is NEVER exposed to the browser. `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID` is used only in the wallet transaction modal.

### Step 3 — Install a Cardano Wallet

Install one of these browser extension wallets and switch it to **Preview Testnet**:

| Wallet | Download | Preview Setup |
|--------|----------|---------------|
| **Lace** (recommended) | [lace.io](https://www.lace.io) | Settings → Network → Preview |
| **Eternl** | [eternl.io](https://eternl.io) | Settings → Network → Preview Testnet |
| **Nami** | [namiwallet.io](https://namiwallet.io) | Settings → Network → Preview |
| **Vespr** | [vespr.xyz](https://vespr.xyz) | Settings → Network → Preview |
| **Flint** | [flint-wallet.com](https://flint-wallet.com) | Settings → Network → Preview |

> ⚠️ If your wallet is connected to **Mainnet**, the app will show: _"Please switch your wallet to Preview Testnet."_ — Switch it before proceeding.

### Step 4 — Get Free Preview Testnet ADA

Your wallet needs test ADA to submit transactions. Test ADA is **completely free**.

1. Open your wallet → copy your **wallet address** (starts with `addr_test1...`)
2. Go to **[https://docs.cardano.org/cardano-testnets/tools/faucet/](https://docs.cardano.org/cardano-testnets/tools/faucet/)**
3. Select **"Preview Testnet"** from the network dropdown
4. Paste your wallet address
5. Click **"Request Funds"**
6. Wait 1–2 minutes — you will receive **10,000 test ADA** (tADA)

> 💡 Each registration transaction costs approximately **~2.17 tADA** (2 ADA deposit + network fee).

> ⚠️ If your wallet balance is insufficient, the registration modal will show: _"Insufficient Preview Test ADA. Please get funds from the faucet."_

### Step 5 — Start the App

```bash
npm run dev
```

Open `http://localhost:3000` and follow the Demo Flow below.

---

## 🧾 Hackathon Demo Flow

```
Register/Login → Submit Idea → SHA-256 Hash Generated →
Connect Cardano Wallet → Anchor Proof on Cardano →
Sign Transaction (in wallet extension) → Real TX Hash →
View Blockchain Certificate → Verify on Cardano →
Find Mentors → Recruit Developers → Track Milestones
```

### Demo Mode vs Live Mode

| Feature | Demo Mode (no keys) | Live Mode (with Blockfrost) |
|---------|--------------------|-----------------------------|
| Register / Login | ✅ localStorage | ✅ Supabase |
| Submit Idea + SHA-256 | ✅ Works | ✅ Works |
| Cardano Registration | ⚠️ Requires wallet + Blockfrost | ✅ Real testnet tx |
| Certificate | ⚠️ Shows "Demo Mode" | ✅ Shows real tx hash |
| Verification | ⚠️ Hash comparison only | ✅ On-chain datum check |
| Mentor / Team features | ✅ Works | ✅ Works |

---

## 🔧 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase service role (server only) |
| `BLOCKFROST_PROJECT_ID` | For live Cardano | Server-side Blockfrost key (Preview) |
| `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID` | For live Cardano | Client-side Blockfrost key (Preview) |
| `CARDANO_NETWORK` | Optional | `preview` (default) |
| `NEXT_PUBLIC_CARDANO_NETWORK` | Optional | `preview` (default) |

---

## ⛓️ Cardano Smart Contract

- **Language**: Aiken v1.1.23
- **Type**: Spend validator (Plutus V3)
- **Network**: Cardano Preview Testnet
- **Validator hash**: `5be9fdc29bfb563b2b78bcac953301a6887d6e7a086d63bbfe031052`
- **Script address**: `addr_test1wr9flt4w5fc5h2pr8cvcxxefthl9e5e4a685d032dqpudpsrzje8g`
- **Tests**: 4/4 passing

```aiken
validator idea_proof_registry {
  spend(datum, _redeemer, _own_ref, tx) {
    let hash_exists    = !bytearray.is_empty(d.idea_hash)
    let hash_length_ok = bytearray.length(d.idea_hash) == 32     // SHA-256 = 32 bytes
    let owner_pkh_ok   = bytearray.length(d.owner_public_key_hash) == 28
    let signed_by_owner = list.has(tx.extra_signatories, d.owner_public_key_hash)
    hash_exists && hash_length_ok && owner_pkh_ok && signed_by_owner
  }
}
```

To rebuild the contract:
```bash
cd smart-contract
./bin/aiken check   # run tests
./bin/aiken build   # regenerate plutus.json
```

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------| 
| Frontend | Next.js 14 (App Router), TypeScript, Vanilla CSS |
| Database | Supabase PostgreSQL + localStorage fallback |
| Blockchain SDK | Mesh SDK (`@meshsdk/core`) — CIP-30 wallet integration |
| Smart Contract | Aiken v1.1.23 (Plutus V3) |
| Cardano API | Blockfrost Preview Testnet |
| Hashing | Web Crypto API (browser-native SHA-256) |
| Icons | Lucide React |
| Demo Mode | localStorage mock — fully functional offline |
e`

```typescript
const hash = await generateIdeaHash({
  owner_id, problem_statement, proposed_solution,
  short_description, submitted_at, target_users, title
});
// → 64-character lowercase hex string
```

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Database | Supabase PostgreSQL + Row Level Security |
| Blockchain SDK | Mesh SDK 1.7 (CIP-30 wallet integration) |
| Smart Contract | Aiken 1.0.29 (Plutus V2) |
| Cardano API | Blockfrost (Preview Testnet) |
| Hashing | Web Crypto API (browser-native SHA-256) |
| Icons | Lucide React |
| Demo Mode | localStorage mock — fully functional offline |

---

## 📄 Documentation

| Document | Purpose |
|----------|---------|
| [docs/architecture.md](docs/architecture.md) | System design, DB schema, client-server flows |
| [docs/cardano-integration.md](docs/cardano-integration.md) | Smart contract, metadata (Label 674), TX building |
| [docs/demo-guide.md](docs/demo-guide.md) | Step-by-step judge walkthrough with Q&A |
| [presentation/presentation-content.md](presentation/presentation-content.md) | 10-slide presentation outline |

---

## 👥 Team — DecentraCoders

| Name | Role | Skills |
|------|------|--------|
| Rohan Sharma | Full-Stack Lead | Next.js, TypeScript, Supabase |
| Arjun Mehta | Blockchain Lead | Aiken, Haskell, Mesh SDK |
| Priya Nair | UI/UX + Testing | Tailwind, Figma, Playwright |

---

## 🛡️ License

MIT License — Open source for the Cardano developer community.

---

*Built with ❤️ at India Codex'26 — Powered by Cardano*
