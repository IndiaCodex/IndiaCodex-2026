# Test ADA Faucet Guide
## LaunchNest — Getting Free Preview Testnet ADA

You need Preview Testnet ADA (tADA) to submit real Cardano transactions. Test ADA has **no real monetary value** and is completely free.

---

## Recommended Balance Before Testing

**Minimum**: 5 tADA  
**Recommended**: 8–10 tADA

This covers:
| Cost | Amount |
|------|--------|
| Script lock (min UTxO) | 2.00 tADA |
| Transaction fee | ~0.17 tADA |
| Change output | ~0.10 tADA |
| Retry margin (2–3 more tests) | ~5.00 tADA |
| **Total recommended** | **~8 tADA** |

---

## Step 1 — Copy Your Wallet Address

1. Open your wallet extension (Lace, Eternl, Nami, etc.)
2. Make sure it is on **Preview Testnet** (address starts with `addr_test1`)
3. Copy your wallet address — right-click on it or use the copy button

> ✅ Address must start with `addr_test1...`  
> ❌ If it starts with `addr1...`, you are on Mainnet — switch to Preview Testnet first

---

## Step 2 — Open the Official Cardano Faucet

Go to: **[https://docs.cardano.org/cardano-testnets/tools/faucet/](https://docs.cardano.org/cardano-testnets/tools/faucet/)**

This is the official IOG (Input Output Global) faucet. Do not use unofficial faucets.

---

## Step 3 — Request Free tADA

1. From the **"Environment"** dropdown, select **"Preview Testnet"**
2. From the **"Asset"** dropdown, select **"tADA"**
3. Paste your `addr_test1...` wallet address in the address field
4. Complete the CAPTCHA if prompted
5. Click **"Request Funds"**

You should see a confirmation message with a transaction ID.

---

## Step 4 — Wait for Funds

- Funds typically arrive within **1–3 minutes**
- You receive **10,000 tADA** per request
- Each address can request once every **24 hours**

To check your balance:
1. Open your wallet extension — it should update automatically
2. Or check on **[https://preview.cardanoscan.io](https://preview.cardanoscan.io)** by searching your address

---

## Step 5 — Refresh Your Wallet Balance

If your wallet doesn't show the balance after 3 minutes:

1. Open your wallet extension
2. Look for a **"Refresh"** or **"Sync"** button
3. Or close and reopen the extension
4. On Eternl: Click the sync icon in the top-right corner

---

## Why Test ADA Has No Real Value

- Preview Testnet is a **sandbox environment** — not connected to the Cardano Mainnet
- tADA cannot be transferred to Mainnet or exchanged for real ADA
- It exists only for testing applications before production
- The LaunchNest hackathon uses Preview Testnet intentionally to demonstrate real Cardano capabilities without financial risk

---

## UI Behaviour for Low Balance

If your wallet balance is too low when attempting registration, LaunchNest shows:

> **"Insufficient Preview test ADA. Fund your wallet from the Cardano faucet before continuing."**

And the wallet signing step will show:

> **"InsufficientFunds: Your wallet does not have enough UTxOs to cover this transaction."**

Solution: Get tADA from the faucet and try again.

---

## Alternative Faucet

If the official faucet is unavailable, try:
- **[https://faucet.preview.world.dev.cardano.org](https://faucet.preview.world.dev.cardano.org)**

---

*LaunchNest | India Codex'26 | Team DecentraCoders*
