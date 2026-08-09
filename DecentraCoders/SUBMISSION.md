# SUBMISSION.md — India Codex'26

---

## Project Information

| Field | Value |
|-------|-------|
| **Project Name** | LaunchNest — Powered by Cardano |
| **Team Name** | DecentraCoders |
| **Hackathon** | India Codex'26 |
| **Track** | Blockchain Innovation |
| **Submission Date** | 2026-07-12 |

---

## Team Members

| Name | Role | Email | GitHub |
|------|------|-------|--------|
| Rohan Sharma | Full-Stack Lead | rohan@iitd.ac.in | @rohan-sharma-dev |
| Arjun Mehta | Blockchain Lead | arjun@bits.ac.in | @arjun-aiken |
| Priya Nair | UI/UX + Testing | priya@nit.ac.in | @priya-nair-ui |

---

## Problem Statement

Student entrepreneurs in India have no affordable, immediate mechanism to prove startup idea ownership. Patent filing costs ₹15,000–₹50,000 and takes 2–4 years. Ideas shared in hackathons and classrooms are routinely appropriated without any cryptographic evidence of origination.

---

## Solution

LaunchNest provides:
1. **Blockchain proof-of-existence** via SHA-256 hash registered on Cardano
2. **Aiken smart contract** that validates ownership cryptographically
3. **Verifiable certificate** linked to a permanent Cardano TX hash
4. **Full startup ecosystem**: mentor matching, developer recruitment, team workspace, milestone tracking

---

## Technology Used

- **Blockchain**: Cardano Preview Testnet
- **Smart Contract**: Aiken 1.0.29 (Plutus V2 spend validator)
- **Wallet Integration**: Mesh SDK 1.7 (CIP-30)
- **Blockchain API**: Blockfrost Preview
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Database**: Supabase PostgreSQL with Row Level Security
- **Hashing**: Web Crypto API — SHA-256 canonical hash (browser-native)

---

## Cardano Integration Details

| Component | Details |
|-----------|---------|
| Network | Preview Testnet |
| Contract Language | Aiken 1.0.29 |
| Plutus Version | V2 |
| Validation Logic | Hash length (32B) + PKH (28B) + Owner signature |
| Inline Datum | Constructor 0: idea_id, hash, owner_pkh, timestamp, app, version |
| Metadata Label | 674 (CIP-10 standard) |
| ADA Locked per TX | 2 ADA |
| Explorer | https://preview.cardanoscan.io |

---

## Repository Structure

```
DecentraCoders/
├── smart-contract/     # Aiken validator + tests + blueprint
├── supabase/           # DB migrations + seed data
├── src/                # Next.js app (12 pages + components + lib)
├── docs/               # Architecture, Cardano integration, demo guide
├── presentation/       # 10-slide presentation outline
├── README.md
├── PRESENTATION.md
└── SUBMISSION.md       # This file
```

---

## Setup Instructions

```bash
# Clone and install
cd DecentraCoders
npm install

# Run in demo mode (no credentials needed)
npm run dev

# Open http://localhost:3000
# Login as "Demo Student" — no wallet required
```

For live Cardano integration, set `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID` in `.env.local`.

---

## Demo Video

*[To be recorded — 3-minute walkthrough following docs/demo-guide.md]*

---

## Originality Statement

This project was conceived, designed, and built entirely during India Codex'26. All code is original. The Aiken smart contract, SHA-256 canonical hashing logic, and demo mode fallback system were specifically engineered for this submission.

---

## Open Source

This project is released under the MIT License and will be made available to the Cardano and Indian startup community after the hackathon.

---

*Submitted by Team DecentraCoders — India Codex'26*
