# Cardano Integration — LaunchNest

> Network: **Preview Testnet** | SDK: **Mesh SDK 1.7** | Contract: **Aiken 1.0.29** | API: **Blockfrost**

---

## 1. Overview

LaunchNest uses Cardano to create **cryptographic proof-of-existence** for startup ideas. Each idea registered on-chain is permanently timestamped and tamper-proof.

---

## 2. Smart Contract — Aiken Validator

### Location
`smart-contract/validators/idea_proof_registry.ak`

### Validator Logic
```aiken
validator {
  fn idea_proof_registry(datum: Datum, _redeemer: Redeemer, ctx: ScriptContext) -> Bool {
    let Datum { idea_hash, owner_pkh, .. } = datum

    // 1. Hash must be exactly 32 bytes (64 hex chars)
    let valid_hash = bytearray.length(idea_hash) == 32

    // 2. Owner PKH must be exactly 28 bytes
    let valid_pkh = bytearray.length(owner_pkh) == 28

    // 3. Owner must have signed the transaction
    let owner_signed = list.any(
      ctx.transaction.extra_signatories,
      fn(sig) { sig == owner_pkh }
    )

    valid_hash && valid_pkh && owner_signed
  }
}
```

### Datum Schema (Plutus Inline Datum)
```
Constructor 0:
  Field 0: idea_id       — Hex-encoded idea UUID string
  Field 1: idea_hash     — 32-byte SHA-256 hash (hex)
  Field 2: owner_pkh     — 28-byte payment key hash (hex)
  Field 3: submitted_at  — POSIX timestamp in milliseconds (integer)
  Field 4: app_name      — "LaunchNest" hex-encoded
  Field 5: version       — "1.0" hex-encoded
```

### Plutus JSON Blueprint
```json
{
  "preamble": {
    "title": "LaunchNest/idea-proof-registry",
    "description": "Validates startup idea hash registration on Cardano Preview Testnet",
    "version": "1.0.0",
    "plutusVersion": "v2",
    "compiler": { "name": "Aiken", "version": "1.0.29" }
  }
}
```

---

## 3. Metadata — Label 674

All LaunchNest blockchain registrations include CIP-10 metadata under label **674**:

```json
{
  "674": {
    "launchnest": {
      "app": "LaunchNest",
      "version": "1.0",
      "network": "preview",
      "idea_id": "<uuid>",
      "idea_hash": "<64-char-hex-sha256>",
      "timestamp": "<ISO-8601-string>",
      "purpose": "idea-proof-registration"
    }
  }
}
```

**Why Label 674?**
Label 674 is the CIP-20 standard for human-readable transaction messages and is widely indexed by Cardano block explorers. This makes LaunchNest transactions discoverable on CardanoScan and similar explorers.

---

## 4. SHA-256 Canonical Hash

### Algorithm
1. Extract these 7 fields from the submitted idea:
   - `owner_id`, `problem_statement`, `proposed_solution`
   - `short_description`, `submitted_at`, `target_users`, `title`
2. Sort keys **alphabetically** (canonical ordering)
3. Serialize as `JSON.stringify(sortedObject)` — UTF-8 string
4. Feed to `SubtleCrypto.digest('SHA-256', ...)` (Web Crypto API)
5. Convert ArrayBuffer → lowercase hex string (64 chars)

### TypeScript Implementation
```typescript
// src/lib/hashing.ts
export async function generateIdeaHash(idea: IdeaHashPayload): Promise<string> {
  const canonicalPayload = {
    owner_id: idea.owner_id,
    problem_statement: idea.problem_statement,
    proposed_solution: idea.proposed_solution,
    short_description: idea.short_description,
    submitted_at: idea.submitted_at,
    target_users: idea.target_users,
    title: idea.title,
  };
  // alphabetical key ordering is already enforced by object literal
  const jsonString = JSON.stringify(canonicalPayload);
  const buffer = new TextEncoder().encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

---

## 5. Transaction Building — Mesh SDK

### Wallet Connection (CIP-30)
```typescript
const wallet = await BrowserWallet.enable('nami');  // or 'eternl', 'vespr'
const address = await wallet.getChangeAddress();
const ownerPkh = resolvePaymentKeyHash(address);    // 28-byte hex
```

### Transaction Structure
```typescript
const tx = new Transaction({ initiator: wallet });

tx.sendLovelace(
  { address: scriptAddress, datum: { inline: mConStr(0, [
    ideaIdHex,   // idea UUID → hex
    hash,        // SHA-256 hex (32 bytes)
    ownerPkh,    // Payment key hash (28 bytes)
    timestamp,   // POSIX ms (int)
    appHex,      // "LaunchNest" → hex
    versionHex,  // "1.0" → hex
  ]) }},
  '2000000'      // 2 ADA locked as collateral
);

tx.setMetadata(674, { launchnest: { /* ... */ } });

const signedTx = await wallet.signTx(unsignedTx);
const txHash   = await wallet.submitTx(signedTx);
```

### Script Address Derivation
```typescript
const { address: scriptAddress } = resolvePlutusScriptAddress(
  { code: plutusScript, version: 'V2' },
  0  // network: 0 = preview/testnet, 1 = mainnet
);
```

---

## 6. Blockfrost API Integration

### Endpoints Used
| Endpoint | Purpose |
|----------|---------|
| `POST /tx/submit` | Submit signed CBOR transaction |
| `GET /txs/{hash}` | Confirm transaction status |
| `GET /txs/{hash}/utxos` | Retrieve script UTxO details |
| `GET /scripts/{hash}` | Validate script deployment |

### Environment Variables
```bash
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=previewXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_CARDANO_NETWORK=preview
```

---

## 7. Demo Mode — Simulated Blockchain

When Blockfrost credentials are unavailable:

1. A simulated TX hash is generated: `demo_tx_<uuid_prefix>`
2. A fake slot number and block number are assigned
3. `blockchain_records` entry is created in localStorage
4. The idea's `blockchain_status` is set to `"Confirmed"` immediately
5. The certificate is generated with a `[DEMO MODE]` watermark notation

**Important**: Demo mode transactions are clearly labeled. They cannot be verified on CardanoScan.

---

## 8. Verification Flow

```
┌────────────────────────────────────────────────────┐
│  User provides: idea_id OR directly enters hash    │
└───────────────────────────┬────────────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │ Fetch idea from DB by id          │
          │ Retrieve stored idea_hash         │
          └─────────────────┬─────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │ Re-compute SHA-256 from live data │
          │ (canonical payload, sorted keys)  │
          └─────────────────┬─────────────────┘
                            │
               ┌────────────▼───────────────┐
               │  stored == recomputed?     │
               └────────────┬───────────────┘
              YES ✅         NO ❌
         INTEGRITY OK   TAMPERED / MODIFIED
```

---

## 9. Cardano Explorer Links

All confirmed transactions can be verified at:
- **CardanoScan (Preview)**: `https://preview.cardanoscan.io/transaction/<tx_hash>`
- **Cexplorer (Preview)**: `https://preview.cexplorer.io/tx/<tx_hash>`
