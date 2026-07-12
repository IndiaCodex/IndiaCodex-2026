# LaunchNest — System Architecture

> Hackathon: India Codex'26 | Team: DecentraCoders | Network: Cardano Preview Testnet

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT                              │
│  Next.js 14 App Router  ·  React 18  ·  TypeScript  ·  Tailwind     │
│                                                                     │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │   Pages /   │  │  CIP-30 Wallet   │  │   Mesh SDK             │  │
│  │   App Router│  │  (Nami/Eternl)   │  │   Transaction Builder  │  │
│  └──────┬──────┘  └───────┬──────────┘  └───────────┬────────────┘  │
│         │                │                          │               │
│         └────────────────┴──────────────────────────┘               │
│                               │                                     │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
          ┌─────────────────────┴──────────────────────┐
          │                                            │
          ▼                                            ▼
┌─────────────────────┐                  ┌─────────────────────────┐
│   Supabase (Postgres)│                  │   Cardano Preview Net   │
│                     │                  │                         │
│  • profiles         │                  │  • Aiken Validator      │
│  • ideas            │                  │  • Plutus Script Lock   │
│  • blockchain_records│                 │  • Inline Datum (CIP-19)│
│  • milestones       │                  │  • Metadata Label 674   │
│  • mentorship_reqs  │                  │  • Blockfrost API       │
│  • team_applications│                  │                         │
│  Row Level Security │                  └─────────────────────────┘
└─────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | Next.js | 14.2 | App Router SSR/CSR hybrid |
| Language | TypeScript | 5.3 | Type safety across codebase |
| Styling | Tailwind CSS | 3.4 | Utility-first dark design system |
| Database | Supabase (PostgreSQL) | 2.x | Auth + real-time CRUD |
| Blockchain SDK | Mesh SDK | 1.7 | Cardano wallet + TX builder |
| Smart Contract Language | Aiken | 1.0.29 | Type-safe Plutus validator |
| Blockchain API | Blockfrost | 0.20 | Cardano node proxy + query |
| Icons | Lucide React | 0.309 | Consistent icon system |
| Hashing | Web Crypto API | Browser-native | SHA-256 canonical hash |

---

## 3. Database Schema

### `profiles` Table
```sql
CREATE TABLE profiles (
  id           UUID PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT NOT NULL,
  role         TEXT CHECK (role IN ('student', 'mentor', 'developer', 'admin')),
  institution  TEXT,
  bio          TEXT,
  skills       TEXT[],    -- developer skill tags
  expertise    TEXT[],    -- mentor domain expertise
  github_url   TEXT,
  website_url  TEXT,
  linkedin_url TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `ideas` Table
```sql
CREATE TABLE ideas (
  id                    UUID PRIMARY KEY,
  owner_id              UUID REFERENCES profiles(id),
  title                 TEXT NOT NULL,
  short_description     TEXT,
  problem_statement     TEXT,
  proposed_solution     TEXT,
  target_users          TEXT,
  category              TEXT,
  status                TEXT DEFAULT 'pending',   -- pending|approved|rejected
  visibility            TEXT DEFAULT 'public',    -- public|private
  idea_hash             TEXT,    -- SHA-256 of canonical payload
  blockchain_status     TEXT DEFAULT 'Pending',   -- Pending|Submitted|Confirmed
  submitted_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### `blockchain_records` Table
```sql
CREATE TABLE blockchain_records (
  id            UUID PRIMARY KEY,
  idea_id       UUID REFERENCES ideas(id),
  tx_hash       TEXT UNIQUE NOT NULL,
  slot_number   BIGINT,
  block_number  BIGINT,
  network       TEXT DEFAULT 'preview',
  ada_locked    NUMERIC DEFAULT 2,
  script_address TEXT,
  confirmed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `milestones` Table
```sql
CREATE TABLE milestones (
  id            UUID PRIMARY KEY,
  idea_id       UUID REFERENCES ideas(id),
  title         TEXT NOT NULL,
  description   TEXT,
  status        TEXT DEFAULT 'pending',   -- pending|in-progress|completed
  order_index   INTEGER,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `mentorship_requests` Table
```sql
CREATE TABLE mentorship_requests (
  id          UUID PRIMARY KEY,
  mentor_id   UUID REFERENCES profiles(id),
  student_id  UUID REFERENCES profiles(id),
  idea_id     UUID REFERENCES ideas(id),
  status      TEXT DEFAULT 'pending',    -- pending|accepted|rejected
  message     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Client–Server Interaction Flow

### 4.1 Idea Submission Flow
```
User fills form → SHA-256 hash computed (browser) → 
POST /api/ideas → Supabase INSERT → 
idea_hash stored → Milestone "Idea Submission" set to completed
```

### 4.2 Cardano Registration Flow
```
User clicks "Register on Cardano" →
CIP-30 wallet prompts connection →
getChangeAddress() → resolvePaymentKeyHash(address) →
Mesh SDK builds TX:
  ├── Script output with 2 ADA locked
  ├── Inline datum: {idea_id, idea_hash, owner_pkh, timestamp, app, version}
  └── Metadata label 674: {launchnest: {idea_id, hash, timestamp, app_version}}
→ Wallet signs TX → Submit to Blockfrost →
TX hash returned → blockchain_records INSERT →
idea.blockchain_status = "Submitted" →
Blockfrost polling confirms → status = "Confirmed"
```

### 4.3 Verification Flow
```
User enters idea_id or hash →
dbService.getIdeaById(id) → retrieve stored idea_hash →
Re-compute SHA-256 from: {owner_id, problem_statement, 
  proposed_solution, short_description, submitted_at, 
  target_users, title} (alphabetical key order) →
Compare hashes → MATCH or MISMATCH displayed
```

---

## 5. Demo Mode Fallback

When `NEXT_PUBLIC_SUPABASE_URL` is not set, the app switches to localStorage mock:

| Mock Data | Count |
|-----------|-------|
| Student profiles | 5 |
| Mentor profiles | 4 |
| Developer profiles | 6 |
| Startup ideas | 6 |
| Blockchain records | 3 |
| Milestones per idea | 6 |

Default demo login: **Rohan Sharma (student)** — auto-loaded, no credentials required.

---

## 6. Security Architecture

| Concern | Implementation |
|---------|---------------|
| Row Level Security | All Supabase tables have RLS policies — users can only read/write their own data |
| Idea Ownership | Smart contract validates `owner_pkh` matches wallet `extra_signatories` |
| Hash Integrity | Canonical SHA-256 with alphabetical key sort prevents re-ordering attacks |
| Wallet Auth | CIP-30 standard — private keys never leave the browser extension |
| Admin Routes | `role === 'admin'` check on every admin page load |

---

## 7. Directory Structure

```
DecentraCoders/
├── smart-contract/          # Aiken Plutus validator
│   ├── aiken.toml
│   ├── lib/types.ak
│   ├── validators/idea_proof_registry.ak
│   ├── tests/idea_proof_registry_test.ak
│   └── plutus.json
├── supabase/
│   ├── migrations/20260712000000_init.sql
│   └── seed.sql
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Shared UI components
│   └── lib/                 # Core logic: hashing, cardano, supabase
├── docs/
│   ├── architecture.md      # This file
│   ├── cardano-integration.md
│   └── demo-guide.md
└── presentation/
    └── presentation-content.md
```
