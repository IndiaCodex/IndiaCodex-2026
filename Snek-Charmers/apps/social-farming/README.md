# Social Farming & Community Growth Engine

A **standalone, event-driven** service that turns every launched meme coin into a community-growth campaign. It is completely decoupled from the launchpad and the blockchain — it **consumes signed events** and **exposes APIs**. It never mints tokens, creates pools, signs transactions, or reads the chain.

Full design: [`../../docs/architecture/social-farming-engine.md`](../../docs/architecture/social-farming-engine.md).

## Stack
NestJS (TypeScript) · PostgreSQL (Prisma) · Redis · BullMQ (later) · in-process event bus (→ Kafka/Redis-Streams at scale).

## Status — Phase 1: Foundation ✅ (built + verified)
- Service scaffold, typed config, health check (`db: up`).
- **Ingestion Gateway** — `POST /events`, HMAC-verified, idempotent (dedupe on `event_id`), append-only `raw_events`, publishes to the internal bus.
- **Identity/Auth** — wallet sign-in: nonce → CIP-30 signature verify → JWT session; protected routes.
- **Activity Tracker (seam)** — `PROJECT_CREATED` registers the project mirror; other events become immutable `activities` (auto-creating the user).

Next phases (see the roadmap in the design doc): Campaign Manager → Reward Engine (PCP) + Trust → Verification/AI → Reputation/Leaderboards/Milestones → Allocation manifest → Analytics/Dashboards.

## Run locally
```bash
cp .env.example .env
docker compose up -d          # Postgres :5433, Redis :6380
npm install
npx prisma db push            # create schema
npm run build && npm start    # http://localhost:4000
```

## Verified Phase-1 behaviour
```
GET  /api/v1/health                    → {"status":"ok","db":"up"}
POST /api/v1/events  (valid HMAC)      → {"status":"accepted"}
POST /api/v1/events  (same event_id)   → {"status":"duplicate"}      # idempotent
POST /api/v1/events  (bad signature)   → 401 Unauthorized             # HMAC guard
POST /api/v1/auth/wallet/nonce         → {"nonce","message"}
GET  /api/v1/users/me  (no token)      → 401 Unauthorized
```
Result: a PROJECT_CREATED registered project `proj-abc`; a TOKEN_PURCHASED created user `addr_test1_alice` and one immutable activity linked to the project.

## Inbound event contract (launchpad → us)
`POST /api/v1/events`, header `x-signature: HMAC-SHA256(rawBody, LAUNCHPAD_WEBHOOK_SECRET)`:
```json
{
  "event_id": "uuid",           // idempotency key
  "type": "TOKEN_PURCHASED",    // PROJECT_CREATED | TOKEN_PURCHASED | TOKEN_SOLD | LP_ADDED | LP_REMOVED | PROJECT_MIGRATED
  "occurred_at": "ISO-8601",
  "project_id": "…",
  "actor_wallet": "addr_test1…",
  "data": { }
}
```

## Layout
```
src/
  ingestion/            # POST /events — HMAC, idempotency, raw store, publish
  modules/identity/     # wallet nonce + CIP-30 verify + JWT
  modules/activity/     # event → immutable activity + project mirror (Phase 2 seam)
  common/               # config, health, internal event bus
  infra/prisma/         # DB client
prisma/schema.prisma    # foundation tables (grows per phase)
```

## Notes
- CIP-30 signature verification is wired but needs a **real wallet** to test the exact signed-payload encoding end-to-end (nonce issuance + JWT + guards are verified).
- Ports are offset (4000 / 5433 / 6380) so this service can run alongside the launchpad (`apps/web`).
