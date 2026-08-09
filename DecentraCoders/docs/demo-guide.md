# Demo Guide — India Codex'26 Judge Walkthrough

> **Team**: DecentraCoders | **Project**: LaunchNest — Powered by Cardano  
> **Network**: Cardano Preview Testnet | **Demo Mode**: Available (no wallet required)

---

## Pre-Demo Setup (5 minutes before)

1. Open terminal in `DecentraCoders/` and run:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000` in Chrome
3. Confirm the landing page loads with the LaunchNest header
4. *(Optional)* Install [Nami Wallet](https://namiwallet.io) or [Eternl](https://eternl.io) Chrome extension and fund with Preview ADA from [testnets.cardano.org/faucet](https://testnets.cardano.org/en/testnets/cardano/tools/faucet/)

---

## Demo Flow — Step by Step

### Step 1 — Landing Page (30 seconds)
**URL**: `http://localhost:3000`

**Show the judges**:
- The hero section: "Prove Your Idea. Own Your Innovation."
- The 4-step flow diagram: Register → Submit → Prove → Launch
- The Cardano badge and "Powered by Aiken Smart Contracts" tagline
- Click **"Get Started"** or **"View Demo"**

---

### Step 2 — Register / Login (1 minute)
**URL**: `http://localhost:3000/register`

**Show the judges**:
- The animated registration form with role selection: Student / Mentor / Developer
- Switch to **Login** tab
- Click **"Demo as Student (Rohan Sharma)"** — instant login, no password needed
- Explain: *"In production this is Supabase Auth; for demo we pre-seed 15 users"*

**After login**, the dashboard loads automatically.

---

### Step 3 — Student Dashboard (1 minute)
**URL**: `http://localhost:3000/dashboard`

**Show the judges**:
- The role-aware greeting: *"Welcome back, Rohan Sharma"*
- Idea hash status card showing `SHA-256` hash of the registered idea
- Blockchain status indicator — if demo record exists, shows **"Confirmed ✅"**
- Quick stats: total ideas, milestones completed, mentor connections

---

### Step 4 — Submit a New Startup Idea (2 minutes)
**URL**: `http://localhost:3000/submit-idea`

**Show the judges**:
1. Fill in:
   - **Title**: `"AgriSense — AI Crop Disease Detection"`
   - **Category**: `AgriTech`
   - **Problem**: `"Indian farmers lose 30% crops annually due to undetected diseases"`
   - **Solution**: `"Mobile app with on-device CNN model, no internet required"`
   - **Target Users**: `"Small-scale farmers in rural India"`
2. Watch the **SHA-256 Hash preview update in real-time** as you type
3. Click **"Submit Idea"**
4. Toast confirms: *"Idea submitted successfully!"*

**Key talking point**: *"The SHA-256 hash is computed client-side using the Web Crypto API — 7 alphabetically ordered fields produce a deterministic fingerprint of this exact idea content."*

---

### Step 5 — Idea Details & Blockchain Registration (3 minutes)
**URL**: `http://localhost:3000/idea/<id>` *(auto-redirected after submit)*

**Show the judges**:
1. The full idea card with title, hash, and `blockchain_status: Pending`
2. Click **"Register on Cardano"** button
3. The **CardanoRegisterModal** opens showing:
   - Step 1: Connect Wallet
   - Step 2: Build Transaction
   - Step 3: Sign & Submit
   - Step 4: Confirm

**With real wallet**: Select Nami/Eternl → Approve connection → Sign TX → Submit → Show TX hash

**Without wallet (Demo Mode)**:
- Click **"Use Demo Mode"** in the modal
- A simulated TX hash is generated instantly
- The idea `blockchain_status` updates to **"Confirmed"**

**Key talking point**: *"The Aiken smart contract validator checks three things: the SHA-256 hash is exactly 32 bytes, the owner PKH is 28 bytes, and the transaction is signed by the owner's key. This is cryptographic non-repudiation on Cardano."*

---

### Step 6 — Blockchain Certificate (2 minutes)
**URL**: `http://localhost:3000/certificate/<id>`

**Show the judges**:
- The printable certificate showing:
  - Startup name and founder
  - SHA-256 hash (64-char hex)
  - Cardano TX hash
  - Slot number and block number
  - Smart contract script address
  - QR code link to CardanoScan
- Click **"Print / Download PDF"** button
- Click the **CardanoScan link** (opens Preview explorer for the TX)

**Key talking point**: *"This certificate is the cryptographic proof-of-existence. The idea's fingerprint is permanently recorded on the Cardano blockchain — no central authority controls it."*

---

### Step 7 — Verify Idea Integrity (1.5 minutes)
**URL**: `http://localhost:3000/verify-idea`

**Show the judges**:
1. Enter the **idea ID** or paste the **SHA-256 hash**
2. Click **"Verify Hash"**
3. System recomputes the hash from stored data and compares
4. Shows: **"✅ INTEGRITY VERIFIED — Hash matches blockchain record"**
5. Then **modify one character** in the input hash → shows **"❌ HASH MISMATCH — Idea may have been tampered"**

**Key talking point**: *"Any modification to the idea — even a single character — produces a completely different SHA-256 hash. The blockchain acts as an immutable reference point."*

---

### Step 8 — Find Mentors & Team Building (1 minute)
**URL**: `http://localhost:3000/mentors` then `http://localhost:3000/developers`

**Show the judges**:
- Mentor cards with expertise tags: Blockchain, AgriTech, VC, AI/ML
- Click **"Request Mentorship"** on Dr. Anil Kumar → success toast
- Switch to Developers tab — Haskell/Aiken/TypeScript skill badges
- Click **"Invite to Team"** on Arjun Mehta → success toast

---

### Step 9 — Team Workspace & Milestones (1 minute)
**URLs**: `/team-workspace` and `/milestones`

**Show the judges**:
- The Kanban board: To Do / In Progress / Done columns
- Click a task card to cycle its status (todo → in-progress → done)
- Add a new task using the **"+ Add Task"** input
- Switch to Milestones — show the timeline with progress bar

---

### Step 10 — Admin Console (30 seconds)
**URL**: `http://localhost:3000/admin`

*(First log in as admin: click "Demo as Admin" on login page)*

**Show the judges**:
- Platform metrics: 15 users, 6 ideas, 3 on-chain proofs
- Blockchain ledger table with TX hashes, slot numbers, block numbers
- Platform health: Demo Mode / Preview Testnet / Aiken Contract status

---

## Common Judge Questions & Answers

| Question | Answer |
|----------|--------|
| *"Is this a real blockchain transaction?"* | Yes, with a Cardano wallet and Preview ADA. Demo mode simulates it for judges without wallets. |
| *"What prevents someone from copying the idea?"* | The hash is tied to the owner's wallet PKH. Only the wallet owner could have registered it at that timestamp. |
| *"Why Cardano over Ethereum?"* | Cardano has provably correct smart contracts via Plutus/Aiken, sub-₹1 transaction fees, and eUTxO model prevents front-running. |
| *"Can someone forge the certificate?"* | No. The TX hash is publicly verifiable on CardanoScan. Any forgery would produce a different hash that doesn't match the chain. |
| *"What happens if Blockfrost is down?"* | The app gracefully falls back to demo mode — ideas can still be submitted, hashed, and locally stored. |

---

## Environment Variables (for live demo)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=previewXXXXXX
NEXT_PUBLIC_CARDANO_NETWORK=preview
```

**Leave these empty** to activate full demo mode with localStorage mock data.
