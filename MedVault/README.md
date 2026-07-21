# MediVault

Privacy-preserving, yield-generating health insurance — built on **Midnight** (zero-knowledge privacy layer) and **Cardano** (on-chain liquidity layer).

No medical data is ever stored server-side. Claims are approved from zero-knowledge proofs, not documents or diagnoses. Idle premiums are put to work as yield-bearing treasury capital instead of sitting dormant, with a hard-coded 80% deployment cap and a liquidity guardrail so claims can always be paid out.

Built for a hackathon. The backend is fully implemented and tested against real Cardano preprod testnet data via Blockfrost — premium payments are verified on-chain, not simulated. Midnight's privacy layer is implemented behind a ports-and-adapters interface and currently backed by a mock adapter, since production Midnight tooling isn't mature yet enough to integrate directly; swapping in a real adapter is a one-line change in `backend/app/api/deps.py`, not a rewrite.

## How it works

1. A user connects a Cardano wallet and signs up for a plan. Instead of storing plan details in the clear, the backend stores a one-way commitment (`SHA-256(user_id | plan_id | salt)`) and discards the salt.
2. The user pays their premium in ADA. The backend verifies the payment against the real Cardano preprod chain (via Blockfrost) — amount, sender, and confirmation count — before activating the policy.
3. Premiums collect in a shared treasury pool. Up to 80% of idle capital can be allocated into yield-bearing strategies; the remaining 20%+ always stays liquid so claims can be paid immediately.
4. To file a claim, the user submits a zero-knowledge proof of eligibility rather than a diagnosis or medical document. The backend verifies the proof and never sees the underlying medical facts.
5. An admin approves the claim and triggers payout. A liquidity guardrail blocks the payout if the pool doesn't have enough free capital, with a clear reason (small pool vs. too much deployed).
6. Every privileged action (approve, reject, payout, allocate, withdraw) is written to an immutable audit log.

## What's in this repo

| Folder | What it is |
|---|---|
| `backend/` | FastAPI API — auth, wallet linking, plans/policies, Cardano premium verification, ZK-style claims, treasury/yield, transaction ledger, audit log. See `backend/README.md`. |
| `frontend/` | Next.js 15 app — three independent portals (User, Hospital Admin, Platform Admin). See `frontend/README.md`. |
| `ARCHITECTURE.md` | Full architecture doc: data model, API surface, security model, module build order. |
| `MediVault_Pitch_Deck.pptx` | Editable pitch deck — problem, solution, architecture, roadmap. |

## Tech stack

- **Backend:** FastAPI (async), PostgreSQL, SQLAlchemy 2, Alembic, Argon2id + JWT, pytest (25 tests), Docker
- **Blockchain:** Cardano preprod via Blockfrost (real), PyCardano CIP-8 wallet signatures (real), Midnight vault/proof verification (mocked behind a swappable interface)
- **Frontend:** Next.js 15, React 19, Tailwind CSS v4, Framer Motion, Recharts

## Quick start

You need both the backend and frontend running. Start the backend first.

**1. Backend** (needs Docker for Postgres, or a local Postgres instance):

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows; source .venv/bin/activate on Mac/Linux
pip install -r requirements.txt
copy .env.example .env                             # then fill in JWT_SECRET, BLOCKFROST_PROJECT_ID, etc.
docker compose up -d db
alembic upgrade head
python -m scripts.seed_plans
uvicorn app.main:app --reload
```

API docs at `http://localhost:8000/docs` · Health check: `GET /api/v1/health`.

**2. Frontend:**

```bash
cd frontend
npm install
npm run dev
```

App at `http://localhost:3000`. `NEXT_PUBLIC_API_URL` in `frontend/.env.local` points it at the backend (defaults to `http://localhost:8000/api/v1`).

**3. To demo the admin portal**, register a normal account through the UI, then promote it:

```bash
cd backend
python -m scripts.create_admin you@example.com
```

## Project status

Ten backend modules shipped, covered by a 25-test pytest suite (auth, wallets, policies/premiums, claims, pool). Frontend is fully wired to the real API for the User and Platform Admin portals — no mock data in those flows. The Hospital Admin portal UI is complete but its backend is still a stub; see `ARCHITECTURE.md` for the full roadmap.

## Security notes for anyone cloning this

- Copy `.env.example` → `.env` in `backend/` and fill in your own `JWT_SECRET`, `BLOCKFROST_PROJECT_ID`, and database credentials. Never commit `.env` — this repo's `.gitignore` already excludes it.
- Passwords are hashed with Argon2id; JWT access tokens are short-lived (15 min) with rotating, single-use refresh tokens (burned on use).
- All money is stored as integer lovelace, never floats, to avoid rounding bugs in a financial system.
- No medical data — diagnoses, documents, patient identity — has a column to live in. It's not encrypted; it's simply never received.
