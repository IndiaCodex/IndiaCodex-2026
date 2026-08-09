# MediVault — Backend

Privacy-preserving, yield-generating health insurance API.
FastAPI · PostgreSQL · SQLAlchemy 2 (async) · Alembic · Argon2/JWT · Cardano (Blockfrost) · Midnight (mocked behind ports).

## Run (local dev)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env           # then edit values
docker compose up -d db          # Postgres on port 5433
alembic upgrade head
python -m scripts.seed_plans
uvicorn app.main:app --reload
```

Docs: http://localhost:8000/docs · Health: `GET /api/v1/health`

Or run everything in Docker: `docker compose up --build`

## Useful commands

| Command | What it does |
|---|---|
| `alembic upgrade head` | Apply DB migrations |
| `alembic revision --autogenerate -m "msg"` | New migration from model changes |
| `python -m scripts.seed_plans` | Create the three default plans |
| `python -m scripts.create_admin you@x.com` | Promote a registered user to admin |
| `python -m scripts.distribute_yield 9.4` | Simulate a yield epoch at 9.4% APY |
| `pytest` | Run the test suite (isolated SQLite, no network) |

## Architecture (short version)

```
routes (HTTP only) → services (business rules) → repositories (SQL only) → Postgres
                          ↓ depends on
                    blockchain/ports.py (interfaces)
                     ├─ cardano/blockfrost_client.py  (REAL preprod reads)
                     ├─ cardano/signature.py          (REAL CIP-8 verification)
                     ├─ cardano/mock_chain.py         (dev only)
                     └─ midnight/mock_vault.py, mock_verifier.py (hackathon stand-ins)
```

Mocks are wired in `app/api/deps.py` and are unreachable when `ENVIRONMENT=production`.

### Honest hackathon notes
- Midnight vault + ZK verification are mocked behind ports with the production
  API shape; swap points are single lines in `deps.py`.
- Premium verification against Cardano preprod via Blockfrost is real.
- CIP-8 wallet signature verification is real (PyCardano).
- Payout/allocation transactions are simulated (no pool wallet keys in the demo).

## Environment variables

See `.env.example` — every variable documented there. Set `ENVIRONMENT=production`
to disable docs, mocks, and dev conveniences.
