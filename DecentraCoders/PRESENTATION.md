# PRESENTATION.md — LaunchNest

> India Codex'26 | Team: DecentraCoders | Track: Blockchain Innovation

---

## Project Summary

**LaunchNest** is a student startup ecosystem that uses Cardano blockchain to provide cryptographic proof-of-existence for startup ideas. Students can submit their ideas, generate a SHA-256 hash, register that hash on-chain via an Aiken smart contract, and receive a verifiable blockchain certificate — all within a single platform that also handles mentor discovery, developer recruitment, team collaboration, and milestone tracking.

---

## Core Innovation

The key innovation is **decentralized IP timestamping for students**:

1. **SHA-256 Canonical Hashing** — 7 alphabetically ordered idea fields produce a deterministic 64-character fingerprint. Any modification changes the hash entirely.

2. **Aiken Smart Contract** — Validates that the hash is exactly 32 bytes, the owner public key hash is 28 bytes, and the transaction is signed by the owner. No trusted intermediary.

3. **Cardano Preview Testnet** — Transactions are permanent, public, and verifiable on CardanoScan. The inline datum contains all proof parameters; metadata label 674 makes them human-readable.

4. **Demo Mode** — Judges without Cardano wallets can experience the full flow via localStorage simulation. Demo TX hashes are clearly labeled as simulated.

---

## Live Demo Instructions

```bash
cd DecentraCoders
npm install && npm run dev
# Open http://localhost:3000
# Click "Demo as Student" on the login page
```

Detailed walkthrough: [docs/demo-guide.md](docs/demo-guide.md)

---

## Key Technical Achievements

- ✅ Custom Aiken spend validator with 3-condition verification
- ✅ Mesh SDK CIP-30 integration with wallet sign + submit flow
- ✅ Blockfrost Preview Testnet API with graceful fallback
- ✅ SHA-256 canonical hash via browser Web Crypto API (zero dependencies)
- ✅ Supabase RLS policies — users can only modify their own data
- ✅ Full 12-page Next.js application with role-aware routing
- ✅ Printable blockchain certificate with CardanoScan QR link
- ✅ localStorage demo database pre-seeded with 15 mock users

---

## Presentation Slides

See [presentation/presentation-content.md](presentation/presentation-content.md) for the full 10-slide outline:

| # | Slide Title |
|---|------------|
| 1 | Title — LaunchNest Powered by Cardano |
| 2 | The Problem — Student IP Has No Protection |
| 3 | Our Solution — 4 Pillars |
| 4 | How It Works — Technical Flow |
| 5 | Aiken Smart Contract |
| 6 | Live Demo Screenshots |
| 7 | Platform Features Table |
| 8 | Technology Stack |
| 9 | Market Opportunity & Impact |
| 10 | Roadmap & Call to Action |

---

## Verification Links

- **Smart Contract Code**: `smart-contract/validators/idea_proof_registry.ak`
- **Blockchain Records**: `http://localhost:3000/admin` (login as admin demo user)
- **CardanoScan Preview**: `https://preview.cardanoscan.io`

---

*LaunchNest — Own your innovation. Build your future.*
