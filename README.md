# 🎓 CredLedger

**Tamper-proof academic credentials, issued and verified on Cardano.**

Built at IndiaCodex'26 · General Track (Built on Cardano) · 12-hour hackathon

🔗 **Live Demo:** [add your Vercel URL here]
📹 **Video/Screenshots:** [add if available]

---

## The Problem

Academic credential fraud isn't hypothetical — it's happening at massive scale, right now, in India:

- In **December 2025**, Kerala Police dismantled a pan-India racket that had produced **over 1 million forged academic certificates** linked to 22 universities, sold from ₹7,500 each and distributed across 8+ states.
- **Manav Bharti University** issued 41,000 degrees over 11 years — investigators found **36,000 of them were fraudulent (87%)**.
- Verifying a genuine degree today means phone calls to registrars, weeks of waiting, and no shared standard across UGC, AICTE, and state education boards.

Employers, universities, and immigration bodies have no fast, trustworthy way to confirm a credential is real.

## The Solution

CredLedger lets institutions issue diplomas and certificates as **tamper-proof NFTs on the Cardano blockchain**. Anyone — an employer, another university — can verify a credential instantly by checking the on-chain record. No PDFs, no forgery, no phone calls.

## How It Works

1. **Institution connects a Cardano wallet** (Eternl, Lace, or Vespr) via the Issuer Portal
2. **Fills in credential details** — student name, degree, institution, graduation date
3. **Mints a CIP-25 NFT** directly to the student's wallet, using a native (signature-locked) minting policy — no smart contract required, a standard and secure Cardano pattern for issuer-controlled minting
4. **Record is cached in Supabase** for instant lookup — but every record is backed by the real on-chain transaction, not just a database claim
5. **Anyone verifies instantly** — scan the auto-generated QR code, or search by wallet address / policy ID in the Verifier Portal — and see a direct link to the transaction on CardanoScan

## Why This Is Different

- **Real on-chain proof, not just a database.** Even if our servers went down, the credential still exists and is verifiable directly on Cardano.
- **No smart contract complexity.** We deliberately used a native minting policy instead of Plutus/Aiken — the right-sized solution for "only the issuer can mint," shipped reliably in a 12-hour window instead of over-engineered.
- **QR-first verification.** Built for real-world use — an employer scans a phone camera, not a technical process.
- **India-focused.** Directly addresses a documented, large-scale, ongoing fraud problem in the Indian education and hiring ecosystem.

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Wallet & Transactions | Mesh SDK (`@meshsdk/core`, `@meshsdk/react`) |
| Blockchain | Cardano Preprod Testnet |
| Metadata Standard | CIP-25 (NFT metadata) |
| Off-chain cache | Supabase |
| Credential image hosting | IPFS via Pinata |
| Deployment | Vercel |

## Minting Policy

CredLedger uses a **native (signature-locked) minting policy** via Mesh SDK's `ForgeScript.withOneSignature()`, rather than a custom Plutus/Aiken smart contract. This is a deliberate, standard Cardano pattern for simple issuer-controlled minting — no validator logic is needed for this use case. See `src/mintCredential.ts` for the implementation, and `MINTING_POLICY.md` for details.

## Local Setup

```bash
npm install
```

Create a `.env` file with:
```
VITE_BLOCKFROST_KEY=your_blockfrost_preprod_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run:
```bash
npm run dev
```

## What's Next

CredLedger is designed as **public-good infrastructure** — a foundational tool that could scale to real Indian universities. Our roadmap beyond this hackathon includes proposing this to **Project Catalyst** for funding to pilot with actual institutions, add credential revocation, and support multi-institution onboarding.

## Team

Shaik Farhana
daraqshah deeba
Mohammed danish
---

*Built in 12 hours at IndiaCodex'26. Minted live on Cardano Preprod Testnet.*