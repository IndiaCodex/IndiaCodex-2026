# Real Transaction Test Guide
## LaunchNest — End-to-End Cardano Preview Testnet Test

This is the official test procedure for validating a real Cardano transaction end-to-end.

**Prerequisites**: Complete the setup in:
- `docs/environment-setup.md` (Blockfrost configured)
- `docs/wallet-setup.md` (wallet on Preview Testnet)
- `docs/test-ada-faucet.md` (at least 8 tADA in wallet)

---

## Pre-Test Checklist

Before starting, verify:
- [ ] `.env.local` has `BLOCKFROST_PROJECT_ID=preview...`
- [ ] Wallet extension installed and switched to Preview Testnet
- [ ] Wallet address starts with `addr_test1...`
- [ ] Wallet balance ≥ 8 tADA
- [ ] `npm run dev` is running at `http://localhost:3000`

---

## Test Steps

### Step 1 — Start the Application

```bash
npm run dev
```

**Expected result**: Application starts at `http://localhost:3000`, no console errors about missing env variables.

---

### Step 2 — Register or Login

1. Open `http://localhost:3000`
2. Click **"Get Started"** or **"Login"**
3. Use the demo login: **"Demo Student (Rohan Sharma)"** OR register a new account

**Expected result**: You are redirected to the Dashboard. Your name appears in the navbar.

---

### Step 3 — Submit a New Idea

1. Click **"Submit Idea"** in the sidebar
2. Fill in all required fields:
   - **Title**: e.g. `FarmChain — Crop Insurance on Cardano`
   - **Description**: At least 50 characters
   - **Problem**: Describe the problem
   - **Solution**: Describe the solution
   - **Target Users**: e.g. `Farmers in rural India`
   - **Category**: Select from dropdown
3. Click **"Submit Idea"**

**Expected result**: Idea is saved. You are redirected to the idea detail page. A SHA-256 hash is displayed.

---

### Step 4 — Verify the SHA-256 Hash

1. On the idea detail page, locate the **"Blockchain Hash"** section
2. The hash should be a 64-character lowercase hex string (e.g. `a3f8c2...`)

**Expected result**: Hash is displayed as exactly 64 hex characters. It was generated using browser-native Web Crypto API from a canonical JSON of your idea fields.

---

### Step 5 — Open the Idea Details Page

1. Navigate to the idea page (you should already be here after Step 3)
2. Locate the **"Anchor Proof on Cardano"** button (purple gradient button)

**Expected result**: Button is visible and clickable.

---

### Step 6 — Connect a Preview Testnet Wallet

1. Click **"Anchor Proof on Cardano"**
2. The Cardano Register Modal opens
3. Your installed wallet(s) appear as buttons — e.g. **"Lace"**, **"Eternl"**
4. Click your wallet name
5. Approve the connection request in the wallet popup

**Expected result**: Modal advances to the "Ready" step. Shows:  
✅ `[Wallet Name] connected on Preview Testnet`  
Address: `addr_test1...` (truncated)

**If you see "Please switch your wallet to Preview Testnet"**: Your wallet is on Mainnet. Switch it to Preview Testnet first.

---

### Step 7 — Confirm Wallet Network and Balance

1. In the "Ready" step, verify:
   - Wallet name matches what you selected
   - Address shows `addr_test1...`
   - Network shows "Preview Testnet"
2. The cost summary shows: **~2.17 tADA total**

**Expected result**: Summary shows the idea title, locked deposit (2.00 tADA), and estimated total (~2.17 tADA).

---

### Step 8 — Click "Sign & Register"

1. Click the **"Sign & Register"** button
2. The modal moves to "Building Transaction..."
3. It reads your wallet UTxOs and builds the Aiken validator transaction

**Expected result**: Status progresses through:  
`Building Transaction... → Awaiting Your Signature → Broadcasting to Cardano`

---

### Step 9 — Approve the Transaction in Your Wallet

1. Your wallet extension automatically pops up
2. Review the transaction details:
   - Output: 2 ADA to the script address
   - Fee: ~0.17 ADA
3. Click **"Confirm"** or **"Approve"** in your wallet

**Expected result**: Wallet popup closes. Modal shows "Broadcasting to Cardano..."

**If you decline**: Modal shows "You declined the signing request. No transaction was submitted. Please try again."

---

### Step 10 — Transaction Submitted

1. After 3–5 seconds, the modal shows **"Transaction Submitted!"**
2. A real 64-character transaction hash appears
3. The status timeline shows: `Build ✓ → Sign ✓ → Submit ✓ → Awaiting Confirmation...`
4. Poll counter increments every 12 seconds

**Expected result**: A real hex transaction hash like:  
`7a3f8c2d9e1b4a5f6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b`

---

### Step 11 — Copy the Real Transaction Hash

1. Click the **copy button** next to the transaction hash
2. Save it — you will need it for verification

**Expected result**: Hash copied to clipboard.

---

### Step 12 — Open the Cardano Preview Explorer

1. In the modal, click **"View on Cardano Preview Explorer"**
2. CardanoScan opens at: `https://preview.cardanoscan.io/transaction/[txHash]`
3. If the transaction is still propagating, the page may show "Not found" for 1–2 minutes — refresh

**Expected result**: Within 1–3 minutes, the explorer shows:
- Transaction hash
- Block height
- Output to script address: `addr_test1wr9flt4w5fc5h2pr8cvcxxefthl9e5e4a685d032dqpudpsrzje8g`
- Inline datum

---

### Step 13 — Wait for Blockfrost Confirmation

1. Back in the LaunchNest modal, watch the poll counter
2. Every 12 seconds, the app checks Blockfrost for confirmation
3. After the transaction is included in a block (1–3 minutes), the modal automatically advances

**Expected result**: Modal shows **"Confirmed on Cardano! 🎉"** with:
- ✅ Transaction Built
- ✅ Wallet Signed
- ✅ Submitted to Network
- ✅ Confirmed — Block #[real block number]

---

### Step 14 — View the Confirmed Certificate

1. Click **"View Confirmed Certificate"**
2. The certificate page opens at `/certificate/[idea-id]`

**Expected result**: Certificate shows:
- **"Verified on Cardano"** badge (green)
- Real transaction hash (64 hex chars)
- Real script address
- Real block height
- Timestamp

---

### Step 15 — Verify On-Chain

1. Go to `/verify-idea`
2. Paste the idea ID or transaction hash
3. Click **"Verify Ledger Proof"**

**Expected result**: Shows **"Idea Verified on Cardano"** with four checkmarks:
- ✓ SHA-256 hash recalculated from idea content
- ✓ Hash matches the database record
- ✓ Transaction confirmed on Cardano Preview Testnet
- ✓ Block height recorded — immutable on-chain proof

---

## Test Complete ✅

If all 15 steps complete successfully, the end-to-end Cardano flow is working correctly.

**Evidence to capture**:
- Screenshot: Modal at "Confirmed — Block #X"
- Screenshot: Certificate with "Verified on Cardano" badge
- Screenshot: CardanoScan Preview showing the transaction
- Screenshot: Verify page showing "Idea Verified on Cardano"
- Copy of the real 64-char transaction hash

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| No wallets shown in modal | No wallet extension installed | Install Lace or Eternl |
| "Wrong Network" error | Wallet on Mainnet | Switch wallet to Preview |
| "Insufficient funds" | Balance < 3 tADA | Get tADA from faucet |
| Modal stuck at "Building Transaction" | Blockfrost not configured | Check `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID` in `.env.local` |
| Transaction not found in Explorer | Still propagating | Wait 2–3 minutes, refresh |
| Confirmation timeout after 6 min | Network issue | Check CardanoScan directly with tx hash |

---

*LaunchNest | India Codex'26 | Team DecentraCoders*
