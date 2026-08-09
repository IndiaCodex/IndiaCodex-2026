# Demo Video Script
## LaunchNest — India Codex'26 | Team DecentraCoders
### Duration: 3–5 minutes

---

## Pre-Recording Setup

Before recording:
- [ ] Browser window: 1920×1080, 100% zoom
- [ ] Cardano wallet installed, on Preview Testnet, balance ≥ 8 tADA
- [ ] Blockfrost configured in `.env.local`
- [ ] `npm run dev` running at `http://localhost:3000`
- [ ] Close all unnecessary browser tabs
- [ ] Record screen + microphone
- [ ] Start at the landing page: `http://localhost:3000`

---

## Script

---

### [0:00 – 0:30] Segment 1: Introduction

**[Show: LaunchNest landing page with animated hero]**

> "Hello, I'm [Your Name] from Team DecentraCoders.
> 
> Every year, thousands of student startup ideas go nowhere — not because they're bad ideas, but because there's no trusted record of who came up with what, and when.
>
> LaunchNest solves this. We're a platform where students can submit startup ideas, find mentors and co-founders, and — most importantly — register cryptographic proof of their ideas on the Cardano blockchain."

---

### [0:30 – 1:00] Segment 2: The Problem

**[Show: Dashboard with milestones and ideas]**

> "The problem is clear: idea theft, lack of ownership records, and no trusted timestamp.
>
> When a student submits their idea to a hackathon or accelerator, there's no way to prove: 'I had this idea first.'
>
> Patents are expensive. Legal agreements are slow. Existing platforms store everything in private databases you can't verify.
>
> We need something that's open, verifiable, and permanent."

---

### [1:00 – 1:30] Segment 3: Why Cardano

**[Show: The smart contract code in the editor or terminal]**

> "We chose Cardano because it combines three things perfectly.
>
> First: Plutus V3 smart contracts, written in Aiken. Our validator enforces that only the correct owner can register a proof, and only a valid 32-byte SHA-256 hash is accepted.
>
> Second: Preview Testnet — we're demonstrating this with real on-chain transactions, not simulations.
>
> Third: True decentralization. No LaunchNest server is involved in the verification. Anyone can verify a proof using only the blockchain."

---

### [1:30 – 2:00] Segment 4: Submit Idea + SHA-256 Hash

**[Show: Navigate to Submit Idea, fill form fields live]**

> "Let me show you the flow.
>
> I'll submit a new startup idea: 'FarmChain — Crop Insurance on Cardano.'
>
> [Fill in the form fields and click Submit]
>
> Notice what happens immediately — a SHA-256 hash is generated from the canonical representation of the idea. Seven fields, alphabetically sorted, hashed using the browser's native Web Crypto API.
>
> [Point to hash on screen]
>
> This hash is the fingerprint of the idea. If even one word changes — the hash changes completely."

---

### [2:00 – 2:45] Segment 5: Connect Wallet + Sign Transaction

**[Show: Idea detail page → click 'Anchor Proof on Cardano']**

> "Now I'll anchor this proof on Cardano.
>
> [Click 'Anchor Proof on Cardano']
>
> The modal detects my Lace wallet — which I've already switched to Preview Testnet.
>
> [Click wallet button]
>
> Wallet connected. You can see the address starting with 'addr_test1' — that's the Preview Testnet format.
>
> The transaction will lock 2 test ADA at our Aiken script address, with the idea hash embedded as an inline datum.
>
> [Click Sign & Register]
>
> My Lace wallet pops up. I can see the transaction — 2 ADA going to the script address, a small network fee.
>
> [Click Confirm in wallet]
>
> Transaction submitted!"

---

### [2:45 – 3:15] Segment 6: Transaction Hash + Cardano Explorer

**[Show: Modal with real tx hash, then open CardanoScan]**

> "Here's the real transaction hash — 64 hexadecimal characters.
>
> [Point to hash]
>
> I can see the status timeline — it's now waiting for block confirmation. Every 12 seconds, the app polls Blockfrost to check if the transaction has been included in a block.
>
> [Click 'View on Cardano Preview Explorer']
>
> CardanoScan opens. Within 1 to 3 minutes, this page will show the transaction fully confirmed, with the output at our script address and the inline datum containing the idea hash."

---

### [3:15 – 3:45] Segment 7: Confirmed Certificate

**[Show: Modal advances to 'Confirmed on Cardano!' → open Certificate]**

> "And there it is — confirmed on Cardano.
>
> Block number [X]. This is a real block on the Cardano Preview Testnet. Immutable, permanent, decentralized.
>
> [Click 'View Confirmed Certificate']
>
> The Blockchain Proof Certificate shows everything: the real transaction hash, the script address, the block height, and — most importantly — the 'Verified on Cardano' badge.
>
> This is not a simulation. This is not a fake hash. This is real on-chain data."

---

### [3:45 – 4:15] Segment 8: On-Chain Verification

**[Show: Verify Idea page → paste idea ID → click Verify]**

> "Finally, let's verify the proof independently.
>
> On the Verify Idea page, I paste the idea ID and click Verify.
>
> [Show 4-step verification process on screen]
>
> The system recalculates the SHA-256 hash from the stored idea fields, compares it to the database record, checks Blockfrost for transaction confirmation, and checks that the block height is real.
>
> Result: 'Idea Verified on Cardano' — four green checkmarks."

---

### [4:15 – 4:45] Segment 9: Platform Features

**[Quick scroll through Mentors, Developers, Team Workspace, Milestones]**

> "LaunchNest isn't just about proof. It's a complete ecosystem.
>
> Students can find mentors in their domain. Recruit developer co-founders. Manage team workspaces. Track milestones. All while their core idea is protected by cryptographic proof."

---

### [4:45 – 5:00] Segment 10: Closing Statement

**[Show: Landing page or certificate one more time]**

> "LaunchNest is built for the next generation of student founders in India.
>
> We give them something no other platform does: a trusted, immutable, Cardano-verified proof of their startup idea — before they pitch it to anyone.
>
> Because LaunchNest doesn't store student ideas on the blockchain. 
>
> **It stores trust on the blockchain.**
>
> Thank you."

---

## Post-Recording Checklist

- [ ] Video is 3–5 minutes (trim if needed)
- [ ] Voice is clear, no background noise
- [ ] Transaction hash is visible and readable
- [ ] CardanoScan Explorer is shown
- [ ] Certificate badge "Verified on Cardano" is visible
- [ ] "Idea Verified on Cardano" on verify page is visible
- [ ] Upload to YouTube (unlisted) or Google Drive
- [ ] Add video link to SUBMISSION.md

---

## Closing Quote (on-screen text suggestion)

```
"LaunchNest doesn't store student ideas on the blockchain.
 It stores trust on the blockchain."

— Team DecentraCoders | India Codex'26
```

---

*LaunchNest | India Codex'26 | Team DecentraCoders*
