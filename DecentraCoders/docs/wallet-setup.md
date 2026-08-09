# Wallet Setup Guide
## LaunchNest — CIP-30 Cardano Wallet Integration

This guide explains how to install a Cardano wallet, switch it to Preview Testnet, and use it with LaunchNest.

---

## Supported Wallets

LaunchNest supports any CIP-30 compatible wallet. These are tested and recommended:

| Wallet | Download | Best For |
|--------|----------|---------|
| **Lace** (recommended) | [lace.io](https://www.lace.io) | Clean UX, good testnet support |
| **Eternl** | [eternl.io](https://eternl.io) | Advanced features, multi-wallet |
| **Nami** | [namiwallet.io](https://namiwallet.io) | Lightweight, fast |
| **Vespr** | [vespr.xyz](https://vespr.xyz) | Mobile-first |
| **Flint** | [flint-wallet.com](https://flint-wallet.com) | Simple, beginner-friendly |

---

## Step 1 — Install a Wallet Extension

1. Choose a wallet from the table above
2. Click the download link
3. Install the browser extension (Chrome, Brave, or Firefox)
4. Pin it to your toolbar for easy access

---

## Step 2 — Create a New Wallet

1. Open the wallet extension
2. Select **"Create new wallet"** (or "New wallet")
3. **Write down your 24-word recovery phrase** on paper — this is your only backup
4. Verify the recovery phrase when prompted
5. Set a spending password

> ⚠️ **Critical**: Your recovery phrase is the only way to restore your wallet. Store it offline in a safe place. Never share it with anyone. Never enter it on any website.

---

## Step 3 — Switch to Preview Testnet

This step is REQUIRED. The app only works on Preview Testnet.

### Lace
1. Open Lace
2. Click the network icon (top-left globe icon)
3. Select **"Preview Testnet"**
4. Confirm the switch

### Eternl
1. Open Eternl
2. Go to **Settings → Network**
3. Select **"Preview Testnet"**
4. Refresh the page

### Nami
1. Open Nami
2. Go to **Settings** (gear icon)
3. Under **Network**, select **"Preview Testnet"**

### Vespr
1. Open Vespr
2. Tap the network badge at the top
3. Select **Preview**

### Flint
1. Open Flint
2. Go to **Settings → Network**
3. Choose **Preview Testnet**

> After switching to Preview Testnet, your wallet will show a different address starting with `addr_test1...`

---

## Step 4 — Verify Preview Testnet

Your Preview Testnet wallet address should:
- Start with `addr_test1` (NOT `addr1`)
- Show **0 ADA** (you need to fund it — see faucet guide)

In LaunchNest, after connecting:
- The navbar shows your wallet name
- The modal shows `addr_test1...` address (truncated)
- Network label shows "Cardano Preview Testnet"

---

## Step 5 — Connect to LaunchNest

1. Open LaunchNest at `http://localhost:3000`
2. Click **"Connect Wallet"** in the navbar, OR
3. Open an idea and click **"Anchor Proof on Cardano"**
4. Select your wallet from the grid
5. Approve the connection in your wallet extension popup
6. Your wallet is now connected ✅

---

## Error Messages

| Message | Cause | Fix |
|---------|-------|-----|
| "No compatible CIP-30 Cardano wallet detected." | No wallet extension installed | Install Lace or Eternl |
| "Please switch your Cardano wallet to Preview Testnet." | Wallet is on Mainnet | Follow Step 3 above |
| "Insufficient Preview test ADA" | Balance too low | Use the faucet (see test-ada-faucet.md) |
| "Could not derive payment key hash" | Wallet returned unexpected address format | Disconnect and reconnect |

---

## Security Notes

- ✅ LaunchNest only reads your address and UTxOs — it never stores your private key
- ✅ All transaction signing happens inside your wallet extension, not on LaunchNest servers
- ✅ You must manually approve every transaction in your wallet popup
- ❌ Never share your 24-word recovery phrase with anyone
- ❌ Never send real ADA to a testnet address

---

*LaunchNest | India Codex'26 | Team DecentraCoders*
