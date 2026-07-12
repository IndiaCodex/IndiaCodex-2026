# OnChainIn — Team RAGNAROK

**IndiaCodex'26 Hackathon submission** | Powered by Nucast Labs

**Live demo:** [https://onchainin.vercel.app](https://onchainin.vercel.app)  
**Main product repo:** [https://github.com/ANSHUL-REAL/OnChainIn](https://github.com/ANSHUL-REAL/OnChainIn)

---

## 1. Your Project

**OnChainIn** — Event operations + **Cardano-verified attendance**.

A full event platform where organizers create events (optionally with AI), approve participants, run wallet/QR check-in on **Cardano Preprod**, collect sponsor/prize flows in ADA, and issue certificates that link to on-chain proof (tx hash + Blockfrost verify).

---

## 2. Project Description

OnChainIn unifies four roles in one product:

| Role | Capabilities |
|------|----------------|
| **Organizer** | AI-assisted event create · free vs Cardano event modes · registration approval · check-in desk · volunteers · sponsors · budget · winners · certificates |
| **Participant** | Browse events · apply · tickets · CIP-30 wallet connect (Lace & other CIP-30 wallets) · on-chain check-in · certificates · proof passport |
| **Volunteer** | Apply for roles · tasks · leaderboard · proof |
| **Sponsor** | Discover events · interest applications · ADA sponsorship after approval · impact summary |

**Cardano flows**

- **Free events** — no participation fee; check-in can still be on-chain.
- **Cardano events** — optional ADA participation fee to organizer wallet.
- **Check-in** — participant self-send (~1 ADA + metadata label `674`); tiny network fee only; ADA stays in the participant wallet (self-send pattern for verifiable attendance).
- **Sponsors / prizes / volunteer payouts** — ADA payments with on-chain status via Blockfrost.
- **Certificates** — clean PNG with tx hash as border microtext; public verify page shows full hash + Blockfrost confirmation.

**Cloud multi-user** — optional Supabase `oci_store` so all users share the same events online; falls back to localStorage offline.

---

## 3. What problem you are trying to solve

Campus and community events still rely on:

- Spreadsheets and screenshot “proof” that can be faked  
- Siloed tools (forms, QR, certificates, sponsors) with no shared source of truth  
- No portable, verifiable attendance record for participants  

**OnChainIn** gives organizers an all-in-one ops stack and gives participants **portable proof** anchored on **Cardano Preprod** — verifiable by anyone with a tx hash and Blockfrost, without trusting a single private database alone.

---

## 4. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS |
| Wallets | Mesh.js · CIP-30 multi-wallet (not Lace-only) |
| Chain | Cardano **Preprod** · tx metadata label `674` · ADA payments |
| Indexing / verify | **Blockfrost** Preprod API (tx status, balance, certificate verify) |
| Multi-user data | **Supabase** (`oci_store` key-value store) + localStorage fallback |
| AI | **Groq** for long-form event drafts / AI create |
| Hosting | **Vercel** SPA (`vercel.json` rewrites) |

---

## 5. Project Demo Photos & Videos

### Screenshots (in-repo)

| Asset | Path |
|-------|------|
| Brand logo | [`public/logo.png`](./public/logo.png) |
| Product visuals | [`public/readme/prompt-to-event.png`](./public/readme/prompt-to-event.png), [`public/readme/proof-engine.png`](./public/readme/proof-engine.png) |
| Pitch deck | [`OnChainIn_Pitch_RAGNAROK.pptx`](./OnChainIn_Pitch_RAGNAROK.pptx) |

### Demo flow (video / live)

1. Open **[https://onchainin.vercel.app](https://onchainin.vercel.app)**  
2. Sign up as **Organizer** → create event (manual or AI) → set free or Cardano mode  
3. Sign up as **Participant** → apply → organizer approves  
4. Connect CIP-30 wallet on **Preprod** → **Check in on-chain**  
5. Organizer issues certificate → open **Verify** page (hash + Blockfrost)  

> Record a short Loom/YouTube walkthrough if needed and paste the link here for judges.

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

**File in this folder:** [OnChainIn_Pitch_RAGNAROK.pptx](./OnChainIn_Pitch_RAGNAROK.pptx)

Upload/share the same deck via Google Drive or GitHub raw if judges prefer a cloud link.

---

## 8. Team Members' Info

**Team name:** RAGNAROK

| Name | GitHub | Email |
|------|--------|-------|
| Anshul Nautiyal | [ANSHUL-REAL](https://github.com/ANSHUL-REAL) | [anshulnautiyal0512@gmail.com](mailto:anshulnautiyal0512@gmail.com) |
| Sourab Reddy | [SOURABREDDY394](https://github.com/SOURABREDDY394) | [sourabreddimalla@gmail.com](mailto:sourabreddimalla@gmail.com) |

**Made with love ❤️ by team RAGNAROK**

---

## Quick architecture

```text
Create event → Apply → Approve → Check-in (QR / CIP-30 wallet) → Certificate → Verify (Blockfrost)
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
