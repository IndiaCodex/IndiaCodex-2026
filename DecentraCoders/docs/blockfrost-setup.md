# Blockfrost Setup Guide
## LaunchNest — Cardano Preview Testnet API

This guide covers the exact configuration of Blockfrost for the LaunchNest Cardano integration.

---

## What is Blockfrost?

Blockfrost is a Cardano node API service. It allows LaunchNest to:
- Submit transactions to the Preview Testnet
- Check transaction confirmation status
- Retrieve block heights and UTxOs
- Verify on-chain datum contents

The free tier allows **50,000 requests/day** — more than enough for hackathon testing.

---

## Create a Blockfrost Account

1. Go to **[https://blockfrost.io](https://blockfrost.io)**
2. Click **"Get started for free"**
3. Sign up with GitHub or email
4. Verify your email address

---

## Create a Preview Testnet Project

1. Log into your Blockfrost dashboard
2. Click **"Add Project"**
3. Fill in:
   - **Name**: `LaunchNest Preview`
   - **Network**: `Cardano Preview` ← CRITICAL — must be Preview, not Mainnet
4. Click **"Save Project"**
5. Your Project ID appears on the project card — it starts with `preview`

---

## Add the Key to `.env.local`

```env
# Server-side only — used in /api/cardano/* routes
BLOCKFROST_PROJECT_ID=previewYOURKEYHERE

# Client-side — used in wallet registration modal only
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=previewYOURKEYHERE
```

Both can be the same key for hackathon purposes.

---

## API Routes That Use Blockfrost

### `GET /api/cardano/transaction/[txHash]`

Checks confirmation status of a submitted transaction.

**Endpoint used**: `https://cardano-preview.blockfrost.io/api/v0/txs/{txHash}`

| Response | Meaning |
|----------|---------|
| `status: "confirmed"` | Tx is in a block — block height included |
| `status: "pending"` | 404 from Blockfrost — tx propagating |
| `configured: false` | `BLOCKFROST_PROJECT_ID` not set |

**Error handling**:
- `404` → returns `pending` (not failed) — tx may still be propagating
- `402` → rate limit hit — returns readable error
- `5xx` → Blockfrost server error — returns 503 to client

### `POST /api/cardano/verify`

Verifies that an idea hash is present in the on-chain datum.

**Endpoints used**:
1. `/txs/{txHash}` — confirm tx exists
2. `/txs/{txHash}/utxos` — get output at script address
3. Checks `inline_datum` contains the idea hash

**Returns**:
```json
{
  "verified": true,
  "txConfirmed": true,
  "blockHeight": 2847123,
  "confirmedAt": "2026-07-12T07:30:00.000Z",
  "message": "Idea hash verified on Cardano Preview Testnet!"
}
```

---

## Network Endpoints

| Network | Endpoint |
|---------|---------|
| Preview Testnet | `https://cardano-preview.blockfrost.io/api/v0` |
| Preprod Testnet | `https://cardano-preprod.blockfrost.io/api/v0` |
| Mainnet | `https://cardano-mainnet.blockfrost.io/api/v0` |

LaunchNest always uses the **Preview** endpoint. Mainnet is never used.

---

## Security

| Rule | Implementation |
|------|---------------|
| Never expose server key | `BLOCKFROST_PROJECT_ID` is server-side only |
| Never use Mainnet | Network derived from `CARDANO_NETWORK=preview` |
| Never return raw error objects | Error messages are sanitized before response |
| 404 = pending, not failed | Transaction propagation takes time |

---

## Rate Limits

Free Blockfrost tier:
- **50,000 requests/day**
- **10 requests/second**

For hackathon testing, this is more than adequate. If you hit limits:
- The API returns HTTP 429
- LaunchNest shows: "Blockfrost rate limit reached. Please try again in a moment."

---

*LaunchNest | India Codex'26 | Team DecentraCoders*
