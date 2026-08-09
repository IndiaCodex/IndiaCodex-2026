# OnChainIn â€” Team RAGNAROK

**IndiaCodex'26 Hackathon submission** | Powered by Nucast Labs

**Live demo:** [https://onchainin.vercel.app](https://onchainin.vercel.app)  
**Main product repo:** [https://github.com/ANSHUL-REAL/OnChainIn](https://github.com/ANSHUL-REAL/OnChainIn)

---

## 1. Your Project

**OnChainIn** â€” Event operations + **Cardano-verified attendance**.

A full event platform where organizers create events (optionally with AI), approve participants, run wallet/QR check-in on **Cardano Preprod**, collect sponsor/prize flows in ADA, and issue certificates that link to on-chain proof (tx hash + Blockfrost verify).

---

## 2. Project Description

OnChainIn unifies four roles in one product:

| Role | Capabilities |
|------|----------------|
| **Organizer** | AI-assisted event create Â· free vs Cardano event modes Â· registration approval Â· check-in desk Â· volunteers Â· sponsors Â· budget Â· winners Â· certificates |
| **Participant** | Browse events Â· apply Â· tickets Â· CIP-30 wallet connect (Lace & other CIP-30 wallets) Â· on-chain check-in Â· certificates Â· proof passport |
| **Volunteer** | Apply for roles Â· tasks Â· leaderboard Â· proof |
| **Sponsor** | Discover events Â· interest applications Â· ADA sponsorship after approval Â· impact summary |

**Cardano flows**

- **Free events** â€” no participation fee; check-in can still be on-chain.
- **Cardano events** â€” optional ADA participation fee to organizer wallet.
- **Check-in** â€” participant self-send (~1 ADA + metadata label `674`); tiny network fee only; ADA stays in the participant wallet (self-send pattern for verifiable attendance).
- **Sponsors / prizes / volunteer payouts** â€” ADA payments with on-chain status via Blockfrost.
- **Certificates** â€” clean PNG with tx hash as border microtext; public verify page shows full hash + Blockfrost confirmation.

**Cloud multi-user** â€” optional Supabase `oci_store` so all users share the same events online; falls back to localStorage offline.

---

## 3. What problem you are trying to solve

Campus and community events still rely on:

- Spreadsheets and screenshot â€œproofâ€ that can be faked  
- Siloed tools (forms, QR, certificates, sponsors) with no shared source of truth  
- No portable, verifiable attendance record for participants  

**OnChainIn** gives organizers an all-in-one ops stack and gives participants **portable proof** anchored on **Cardano Preprod** â€” verifiable by anyone with a tx hash and Blockfrost, without trusting a single private database alone.

---

## 4. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 Â· TypeScript Â· Vite Â· Tailwind CSS |
| Wallets | Mesh.js Â· CIP-30 multi-wallet (not Lace-only) |
| Chain | Cardano **Preprod** Â· tx metadata label `674` Â· ADA payments |
| Indexing / verify | **Blockfrost** Preprod API (tx status, balance, certificate verify) |
| Multi-user data | **Supabase** (`oci_store` key-value store) + localStorage fallback |
| AI | **Groq** for long-form event drafts / AI create |
| Hosting | **Vercel** SPA (`vercel.json` rewrites) |

---

## 5. Project Demo Photos & Videos

### Demo video (Loom)

**Watch the full walkthrough:**  
[https://www.loom.com/share/24c98573cbe54675973c2c2cc9155db3](https://www.loom.com/share/24c98573cbe54675973c2c2cc9155db3)

### Screenshots (in-repo)

| Asset | Path |
|-------|------|
| Brand logo | [`public/logo.png`](./public/logo.png) |
| Product visuals | [`public/readme/prompt-to-event.png`](./public/readme/prompt-to-event.png), [`public/readme/proof-engine.png`](./public/readme/proof-engine.png) |
| Pitch deck | [`OnChainIn-Pitch-Deck.pptx`](./OnChainIn-Pitch-Deck.pptx) |

### Demo flow (live)

1. Open **[https://onchainin.vercel.app](https://onchainin.vercel.app)**  
2. Sign up as **Organizer** → create event (manual or AI) → set free or Cardano mode  
3. Sign up as **Participant** → apply → organizer approves  
4. Connect CIP-30 wallet on **Preprod** → **Check in on-chain**  
5. Organizer issues certificate → open **Verify** page (hash + Blockfrost)

### Local demo

```bash
cd RAGNAROK
npm install
cp .env.example .env   # add Supabase / Blockfrost / Groq as needed
npm run dev
```

Open **http://localhost:3000**

---

## 6. Live Project Link

**Production:** [https://onchainin.vercel.app](https://onchainin.vercel.app)

Env used in production (set in Vercel, not committed):

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`  
- `VITE_CARDANO_NETWORK=preprod`  
- `VITE_BLOCKFROST_PROJECT_ID`  
- `VITE_GROQ_API_KEY` (optional AI drafts)

---

## 7. PPT Link

**Pitch deck uploaded in this folder (required by rules):**

- [OnChainIn-Pitch-Deck.pptx](./OnChainIn-Pitch-Deck.pptx)
- Same file also as [OnChainIn_Pitch_RAGNAROK.pptx](./OnChainIn_Pitch_RAGNAROK.pptx)

---

## 8. Team Members' Info

**Team name:** RAGNAROK

| Name | GitHub | Email |
|------|--------|-------|
| Anshul Nautiyal | [ANSHUL-REAL](https://github.com/ANSHUL-REAL) | [anshulnautiyal0512@gmail.com](mailto:anshulnautiyal0512@gmail.com) |
| Sourab Reddy | [SOURABREDDY394](https://github.com/SOURABREDDY394) | [sourabreddimalla@gmail.com](mailto:sourabreddimalla@gmail.com) |

**Made with love â¤ï¸ by team RAGNAROK**

---

## Quick architecture

```text
Create event â†’ Apply â†’ Approve â†’ Check-in (QR / CIP-30 wallet) â†’ Certificate â†’ Verify (Blockfrost)
```

| Path | Role |
|------|------|
| `src/pages/` | Home, auth, dashboards, verify |
| `src/lib/cardano.ts` | Wallet + on-chain check-in / ADA pay |
| `src/lib/blockfrost.ts` | Tx confirm, balance, cert verify |
| `src/lib/cloudSync.ts` | Supabase multi-user sync |
| `supabase/migrations/` | SQL for multi-user (`oci_store`) |
| `public/logo.png` | Brand mark |

---

## License / notes for judges

- Submission folder for **IndiaCodex-2026** only under **RAGNAROK/**.  
- Secrets (`.env`) are never committed; use `.env.example`.  
- Demo network is **Cardano Preprod** (test ADA).
