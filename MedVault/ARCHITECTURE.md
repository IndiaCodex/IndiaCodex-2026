# MediVault — Architecture Document

Privacy-preserving, yield-generating health insurance on Midnight + Cardano.
**Backend only.** This document is the blueprint we build from, one module at a time.

---

## 1. The Big Picture

```
┌──────────────┐        ┌─────────────────────────────┐        ┌──────────────────┐
│   Frontend   │  HTTPS │      FastAPI Backend        │        │   PostgreSQL     │
│ (later step) │───────▶│  (this is what we build)    │───────▶│   (our database) │
└──────────────┘        └──────────┬──────────────────┘        └──────────────────┘
                                   │
                    ┌──────────────┼───────────────────┐
                    ▼              ▼                   ▼
             ┌────────────┐ ┌──────────────┐  ┌────────────────┐
             │ Blockfrost │ │ Cardano      │  │ Midnight Layer │
             │ (API to    │ │ preprod      │  │ (abstracted —  │
             │ read chain)│ │ testnet      │  │ see section 8) │
             └────────────┘ └──────────────┘  └────────────────┘
```

**Beginner concept — what a backend actually does here:** the blockchain holds money and proofs; the backend is the coordinator. It authenticates users, tracks policies and claims, talks to the chain via Blockfrost, verifies things, and exposes a clean API the frontend calls. The backend must NEVER hold medical data — that is the whole point of the product.

**The privacy rule that shapes everything:** sensitive data (medical records, diagnoses, claim details) never touches our server or database. We only store *commitments* (cryptographic fingerprints — like a hash) and *proof results* (valid / invalid). If our database leaked tomorrow, no medical secret would leak with it.

---

## 2. Tech Stack & Why

| Choice | What it is | Why |
|---|---|---|
| Python 3.12 + FastAPI | Web framework | Async, automatic OpenAPI docs, Pydantic validation built in — the modern standard for Python APIs |
| PostgreSQL 16 | Relational database | Our data is highly relational (users → policies → payments → claims). Postgres gives ACID transactions (money must never be half-recorded), UUID support, and it's what real fintech runs on. SQLite can't handle concurrent writes well; MongoDB gives up relational integrity we need. |
| SQLAlchemy 2.0 (async) + asyncpg | ORM (maps Python classes ↔ DB tables) | Type-safe queries, async so one slow DB call doesn't block other requests |
| Alembic | Database migrations | Version control for your database schema — every schema change is a reviewable, reversible script |
| Pydantic v2 + pydantic-settings | Validation + config | Every request body is validated before our code runs; config is loaded from environment variables with type checking |
| Argon2 | Password hashing | Current OWASP recommendation; won the Password Hashing Competition. Never store plain passwords. |
| JWT (access + refresh tokens) | Authentication | Stateless auth — server doesn't keep sessions in memory, which scales |
| PyCardano + Blockfrost API | Cardano integration | Blockfrost = hosted API to read/submit to Cardano (no need to run our own node). PyCardano verifies wallet signatures (CIP-8/CIP-30) server-side. Mesh SDK is JavaScript — it belongs in the frontend for building transactions. |
| structlog | Logging | Structured JSON logs — searchable in production, readable in dev |
| slowapi | Rate limiting | Stops brute-force login attempts and API abuse |
| pytest + httpx | Testing | Async-friendly test client that calls our API like a real user |
| Docker + docker-compose | Packaging/deployment | "Works on my machine" → works everywhere; one command starts API + Postgres |
| uv | Package manager | Modern, fast replacement for pip; lockfile = reproducible installs |

---

## 3. Clean Architecture — The Layers

**Beginner concept:** Clean Architecture means organizing code in layers where each layer only talks to the layer directly below it, and business logic never depends on infrastructure details. Why? So you can swap Postgres for another DB, or mock Midnight for real Midnight, without rewriting business rules — and so every layer is testable in isolation.

```
Request → API layer → Service layer → Repository layer → Database
                          │
                          └────────→ Blockchain ports → Adapters (Blockfrost, Midnight)
```

| Layer | Folder | Responsibility | Must NOT do |
|---|---|---|---|
| API | `app/api/` | HTTP routes, auth checks, translate HTTP ↔ Python | Business logic, SQL |
| Schemas | `app/schemas/` | Pydantic request/response shapes | Anything else |
| Services | `app/services/` | Business rules ("a claim needs a verified proof before payout") | Know about HTTP or SQL |
| Repositories | `app/repositories/` | All database queries | Business decisions |
| Models | `app/models/` | SQLAlchemy table definitions | Logic |
| Blockchain ports | `app/blockchain/ports.py` | Interfaces (abstract classes) the services depend on | Implementation |
| Blockchain adapters | `app/blockchain/cardano/`, `app/blockchain/midnight/` | Real Blockfrost calls; mock Midnight | Business rules |
| Core | `app/core/` | Config, security utils, logging, exceptions | Domain logic |

**Dependency Injection (beginner concept):** instead of a service creating its own database connection or Blockfrost client, those are *handed to it* (injected) by FastAPI's `Depends()` system. In tests we hand it fakes. This is the single biggest enabler of testable code.

**Ports & Adapters (beginner concept):** a "port" is a Python abstract class like `ZKProofVerifierPort` with a method `verify(proof) -> bool`. Services only know the port. Today the adapter behind it is `MockMidnightVerifier`; when Midnight's real API ships, we write `MidnightVerifier` and change one line of wiring. The hackathon/production seam lives exactly here.

---

## 4. Folder Structure

```
health/                              (your repo root)
├── app/
│   ├── main.py                      # App factory: creates FastAPI app, wires everything
│   ├── core/
│   │   ├── config.py                # Settings from environment variables
│   │   ├── security.py              # Password hashing, JWT create/verify
│   │   ├── logging.py               # structlog setup
│   │   └── exceptions.py            # Custom exceptions + global handlers
│   ├── db/
│   │   ├── session.py               # Async engine + session factory
│   │   └── base.py                  # SQLAlchemy declarative base
│   ├── models/                      # One file per table (user.py, policy.py, ...)
│   ├── schemas/                     # Pydantic models mirroring the API contracts
│   ├── repositories/                # user_repo.py, policy_repo.py, claim_repo.py, ...
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── wallet_service.py
│   │   ├── policy_service.py
│   │   ├── premium_service.py
│   │   ├── claim_service.py
│   │   ├── pool_service.py          # Pool accounting + yield allocation rules
│   │   └── transaction_service.py
│   ├── blockchain/
│   │   ├── ports.py                 # CardanoChainPort, PrivateVaultPort, ZKVerifierPort, YieldStrategyPort
│   │   ├── cardano/
│   │   │   ├── blockfrost_client.py # REAL preprod calls: tx lookup, confirmations, balances
│   │   │   └── signature.py         # CIP-8 wallet signature verification
│   │   └── midnight/
│   │       ├── mock_vault.py        # HACKATHON: commitment registry simulating private vault
│   │       └── mock_verifier.py     # HACKATHON: simulated ZK proof verification
│   └── api/
│       ├── deps.py                  # Reusable dependencies: current_user, admin_only, db session
│       └── v1/
│           └── routes/              # auth.py, users.py, wallets.py, plans.py, policies.py,
│                                    # premiums.py, claims.py, pool.py, transactions.py, health.py
├── alembic/                         # Migration scripts
├── tests/
│   ├── conftest.py                  # Test fixtures (test DB, fake adapters, auth helper)
│   ├── unit/                        # Service tests with fakes
│   └── api/                         # Full request→response tests
├── .env.example                     # Every env var documented, no real secrets
├── pyproject.toml
├── docker-compose.yml               # api + postgres
├── Dockerfile
└── ARCHITECTURE.md                  # this file
```

---

## 5. Database Schema

**Design principle:** store *references and statuses*, never medical content. UUIDs as primary keys (don't leak row counts, safe to expose in APIs). All money stored as `BIGINT` lovelace (1 ADA = 1,000,000 lovelace) — never floats, because floats lose pennies.

```
users            wallets              insurance_plans        policies
─────            ───────              ───────────────        ────────
id (UUID)        id                   id                     id
email (unique)   user_id ─▶ users     name                   user_id ─▶ users
hashed_password  address (unique)     coverage_lovelace      plan_id ─▶ insurance_plans
role             network              premium_lovelace       status
is_active        is_verified          period_days            commitment_hash   ← only privacy artifact
created_at       verified_at          max_claims_per_year    start_date
                                      is_active              next_premium_due

premium_payments        claims                    zk_proof_records
────────────────        ──────                    ────────────────
id                      id                        id
policy_id ─▶ policies   policy_id ─▶ policies     claim_id ─▶ claims
amount_lovelace         claim_reference (public)  proof_hash        ← hash only, never the proof inputs
tx_hash (unique)        amount_lovelace           verifier ("mock_midnight" | "midnight")
status                  status                    is_valid
confirmed_at            payout_tx_hash            verified_at
created_at              created_at / decided_at

yield_allocations            pool_snapshots           transactions
─────────────────            ──────────────           ────────────
id                           id                       id
strategy                     total_pool_lovelace      user_id ─▶ users (nullable)
amount_lovelace              allocated_lovelace       type (premium|payout|allocate|deallocate|yield)
target_pct                   liquid_lovelace          direction (in|out)
status                       snapshot_at              amount_lovelace
tx_hash                                               tx_hash
allocated_by ─▶ users                                 status
created_at                                            created_at

audit_logs: id, actor_id, action, entity, entity_id, metadata (JSONB), created_at
```

Statuses (enforced as Python enums + DB constraints):
- policy: `pending → active → lapsed | cancelled`
- premium: `pending → confirmed | failed`
- claim: `submitted → proof_verified → approved → paid` (or `rejected` at any pre-paid step)
- allocation: `pending → active → withdrawn`

Key invariants the service layer enforces:
1. `allocated_lovelace ≤ 80% of total_pool_lovelace` (configurable cap)
2. A claim can only be `approved` if its proof record has `is_valid = true`
3. A payout can only happen if `liquid_lovelace ≥ claim.amount_lovelace`
4. `tx_hash` unique — the same on-chain deposit can never be credited twice (replay protection)

---

## 6. API Routes (v1)

All under `/api/v1`. 🔓 = public, 🔑 = logged-in user, 👑 = admin.

```
Auth        🔓 POST /auth/register            🔓 POST /auth/login            🔓 POST /auth/refresh
Users       🔑 GET  /users/me
Wallets     🔑 POST /wallets/challenge        # server issues a random nonce to sign
            🔑 POST /wallets/verify           # verify CIP-8 signature → wallet linked
            🔑 GET  /wallets
Plans       🔓 GET  /plans                    👑 POST /plans
Policies    🔑 POST /policies                 🔑 GET  /policies/me
Premiums    🔑 POST /premiums/deposit         # submit tx_hash; backend verifies on-chain
            🔑 GET  /premiums/me
Claims      🔑 POST /claims                   # claim + ZK proof payload
            🔑 GET  /claims/me
            👑 GET  /claims                   👑 POST /claims/{id}/approve   👑 POST /claims/{id}/payout
Pool        🔓 GET  /pool/status              # public transparency: totals only, no user data
            👑 POST /pool/allocations         👑 POST /pool/allocations/{id}/withdraw
Txns        🔑 GET  /transactions/me
Meta        🔓 GET  /health                   🔓 /docs (OpenAPI, dev only)
```

---

## 7. The Five Core Flows

### 7.1 Authentication (hybrid)
1. Register: email + password → Argon2 hash stored → user created with role `user`.
2. Login: verify hash → issue **access token** (JWT, 15 min) + **refresh token** (7 days, rotated on every use).
   *Why two tokens?* If an access token leaks it dies in 15 minutes; the refresh token allows staying logged in without re-entering passwords.
3. Wallet link: backend issues a random nonce → user signs it with their Cardano wallet (frontend, CIP-30) → backend verifies the CIP-8 signature cryptographically → wallet address is now proven to belong to this account. No private keys ever touch our server.

### 7.2 Premium deposit
1. User picks a plan → policy created as `pending`, and a **commitment hash** is registered in the (mock) Midnight vault — this is the private link between the user and their policy.
2. Frontend (Mesh SDK) builds and submits the ADA transaction to the **pool wallet address** on preprod. The backend never holds user keys.
3. User posts the `tx_hash` to `/premiums/deposit`.
4. Backend verifies via Blockfrost (real call): tx exists, sends ≥ premium to pool address, originates from the user's verified wallet, has enough confirmations.
5. Payment `confirmed` → policy `active` → transaction history recorded.

### 7.3 Claim + ZK proof
**Production design:** user's device generates a real ZK proof against a Midnight smart contract: "I hold a valid policy commitment, my condition is covered, I'm within limits" — revealing nothing else. Midnight verifies on-chain.
**Hackathon implementation:** same API shape and same data flow, but `MockMidnightVerifier` checks the proof payload against the registered commitment and simulates verification. The seam is one adapter class.
1. `POST /claims` with claim amount + proof payload (opaque blob to us).
2. `ZKVerifierPort.verify()` → proof record stored (hash + result only).
3. Valid → `proof_verified` → admin approves → payout checked against liquidity invariant → sent from pool wallet on preprod → `paid`.
4. Claim references are random public IDs; nothing in our DB says *why* the claim was made.

### 7.4 Yield allocation
1. Admin calls `POST /pool/allocations` with strategy + amount.
2. `PoolService` enforces: cap ≤ 80%, minimum liquid reserve retained for pending claims.
3. `YieldStrategyPort` executes. **Hackathon:** a simulated strategy position accruing a fixed APY (clearly labeled). **Production:** whitelisted Cardano DeFi protocols / staking.
4. `pool_snapshots` records the split over time → powers a transparency dashboard later.

### 7.5 Transaction history
Every money movement writes one `transactions` row. Users see only their own; the pool's aggregate view is public but contains no personal linkage.

---

## 8. Midnight: Production Design vs Hackathon Implementation

| Concern | Production design | Hackathon implementation |
|---|---|---|
| Private vault | Compact smart contract on Midnight holding shielded policy state | `mock_vault.py`: commitment registry (SHA-256 commitments) in our DB |
| Proof generation | Client-side prover (Midnight proof server) | Frontend sends a structured payload standing in for a proof |
| Proof verification | On-chain verification on Midnight | `mock_verifier.py` re-computes/checks the commitment |
| Privacy guarantee | Cryptographic (ZK) | Architectural (no medical data ever stored) — honest about the difference |
| Cardano bridge | Midnight↔Cardano interop as it matures | Real preprod ADA movements for deposits/payouts |

Everything behind `ports.py`, so the swap is contained. In demos and the README we state plainly which parts are real and which are simulated — judges respect honesty.

---

## 9. Security Checklist

- **Argon2 password hashing** — passwords are unrecoverable even by us
- **JWT access (15 min) + rotating refresh tokens** — small blast radius on leaks
- **RBAC** — `user` vs `admin` roles enforced by a reusable dependency
- **Pydantic validation on every input** — malformed/malicious payloads rejected before logic runs
- **Rate limiting** (slowapi) — strict on `/auth/*`, sane defaults elsewhere
- **Secrets only in environment variables** — `.env` gitignored, `.env.example` documents keys; secrets manager in production
- **Wallet ownership by signature** — nobody can register someone else's address
- **tx_hash uniqueness** — deposit replay protection
- **Safe error handling** — clients get clean messages + request IDs; stack traces only in logs
- **No medical data at rest, ever** — the strongest control is not having the data
- **CORS locked to frontend origin; docs disabled outside dev**

---

## 10. Deployment

Hackathon: `docker-compose up` → FastAPI (uvicorn) + Postgres, `.env` for config, Alembic migrations run on start.
Production path (documented, not built): managed Postgres, container platform (Fly.io/Railway/ECS), secrets manager, HTTPS via reverse proxy, log aggregation, CI running pytest + ruff.

---

## 11. Build Order (one module per session step)

1. **Scaffold** — project skeleton, uv, config, structlog, health endpoint, Docker
2. **Database** — models, async session, Alembic, first migration
3. **Auth** — register/login/refresh, Argon2, JWT, RBAC deps
4. **Wallets** — nonce challenge + CIP-8 signature verification
5. **Plans & Policies** — enrollment + Midnight commitment registration
6. **Cardano + Premiums** — Blockfrost client, deposit verification
7. **Claims + ZK** — mock verifier, claim lifecycle
8. **Pool & Yield** — allocation rules, snapshots, payouts
9. **Transactions + polish** — history, audit logs, rate limiting hardening
10. **Tests + Docker finalization**

Each step: explain → build → run → test → your confirmation → next.

---

*Approve this architecture (or request changes) and we start with Module 1.*
