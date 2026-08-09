# CardGuard AI

## Team Name: M4

---

## Project

**CardGuard AI** — AI-Powered Smart Contract Security Auditor for Cardano

## Description

CardGuard AI is a web-based security auditing tool that analyzes Cardano smart contracts (Plutus, Aiken, Marlowe) for vulnerabilities, generates risk scores, simulates attacks, and auto-fixes issues — all with a cinematic Cardano-themed UI.

## Problem We're Solving

Cardano smart contracts handle millions of dollars in ADA. A single vulnerability can lead to catastrophic fund loss. Currently, security auditing requires expensive manual review by specialists. CardGuard AI makes security auditing **accessible, instant, and free** for every Cardano developer.

## What It Does

| Feature | Description |
|---------|-------------|
| **Quick Scan** | Regex-based vulnerability detection (16+ patterns) — zero setup, instant results |
| **AI Deep Scan** | Llama 3.3 70B via Groq — detects logic bugs, attack vectors, gas optimizations |
| **Attack Simulator** | Cinematic terminal animation showing how exploits work in real-time |
| **One-Click Auto Fix** | AI rewrites vulnerable code with side-by-side diff viewer |
| **Risk Scoring** | 0-100 security score with severity breakdown (Critical/High/Medium/Low) |
| **File Upload** | Drag & drop .hs, .ak, .marlowe files |
| **On-Chain Submission** | Submit audit hash to Cardano testnet via Blockfrost |

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **AI:** Groq API (Llama 3.3 70B Versatile) — free tier
- **Blockchain:** Blockfrost API (Cardano Testnet), Mesh.js SDK
- **Smart Contract:** Aiken (CardGuard Validator)
- **Styling:** Glassmorphism, 3D hover effects, Cardano brand colors (#0033ad)
- **Deployment:** Cloudflare Pages (static export)

## Live Demo

🔗 **https://cardguard-ai.pages.dev**

## Screenshots

### Landing Page
Cardano-themed glassmorphism UI with 3D interactive cards.

### Security Audit
Paste code → Instant vulnerability scan with risk scoring.

### Attack Simulator
Cinematic terminal animation showing real exploit scenarios.

### Auto-Fix with Diff
One-click AI fix with side-by-side code comparison.

## Smart Contract

The CardGuard Validator (`contracts/cardguard_validator.ak`) is an Aiken smart contract that:
- Records audit hashes on-chain
- Links audit results to wallet addresses
- Provides immutable proof of security review

```aiken
validator {
  fn audit(datum, _redeemer, ctx) -> Bool {
    ctx.started_before == 0
    && ctx.must_be_signed_by(
        datum.owner
      )
  }
}
```

## How to Run

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your Groq API key (free at console.groq.com)

# Run development server
npm run dev

# Or use the batch file (Windows)
start.bat
```

## Team Members

| Name | Role |
|------|------|
| M4SPIDER | Full-Stack Developer |

## Timeline

- Built during **IndiaCodex'26 Hackathon**
- Duration: 6 hours
- Track: General

## License

MIT License

---

**IndiaCodex'26 | Powered by Nucast Labs**
