# Environment Setup Guide
## LaunchNest — Powered by Cardano | India Codex'26

This guide walks you through setting up every environment variable required to run LaunchNest with real Cardano Preview Testnet integration.

---

## 1. Create `.env.local`

Never commit secrets to Git. Use a local-only file:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in each variable below.

> **Why `.env.local`?**  
> Next.js automatically loads `.env.local` and excludes it from the build output. It is listed in `.gitignore`. Never rename it `.env` or commit it.

---

## 2. Supabase Setup (Optional — localStorage fallback if not set)

Supabase provides the PostgreSQL database. If you skip this, the app runs entirely on `localStorage` with demo data.

### Step 1 — Create a Supabase project
1. Go to **[https://supabase.com](https://supabase.com)** and sign in
2. Click **"New Project"**
3. Choose an organization, set a project name (e.g. `launchnest`)
4. Set a strong database password
5. Select the **closest region** (e.g. Singapore for India)
6. Click **"Create new project"** — wait ~2 minutes

### Step 2 — Copy your Supabase URL
1. In your project dashboard, go to **Settings → API**
2. Under **"Project URL"**, copy the URL
3. It looks like: `https://abcdefgh.supabase.co`
4. Paste it into `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
```

### Step 3 — Copy the Anon Key
1. On the same **Settings → API** page
2. Under **"Project API keys"** → copy the `anon` / `public` key
3. Paste it into `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4 — Copy the Service Role Key
1. On the same page, reveal and copy the `service_role` key
2. **Keep this secret** — it bypasses Row Level Security
3. Paste into `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5 — Run the database schema
```bash
# In Supabase dashboard → SQL Editor → paste and run:
cat supabase/migrations/20260712000000_init.sql
```

---

## 3. Blockfrost Setup (Required for real Cardano transactions)

Blockfrost is the Cardano node API that lets the app read and write to the Preview Testnet.

### Step 1 — Create a Blockfrost account
1. Go to **[https://blockfrost.io](https://blockfrost.io)**
2. Click **"Get started for free"**
3. Create an account (GitHub, Google, or email)

### Step 2 — Create a Preview Testnet project
1. After logging in, click **"Add Project"**
2. Set **Name**: `LaunchNest Preview`
3. Set **Network**: **`Cardano Preview`** ← CRITICAL: must NOT be Mainnet
4. Click **"Save Project"**

### Step 3 — Copy the Project ID
1. On the project page, your **Project ID** is displayed
2. It starts with `preview` — e.g. `previewABCDEFGH...`
3. Add it to `.env.local` in **both** variables:

```env
# Server-side (used in /api/cardano/* routes — never sent to browser)
BLOCKFROST_PROJECT_ID=previewABCDEFGHIJKLMNOPQRSTUVWXYZ123456

# Client-side (used only in the wallet transaction modal)
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=previewABCDEFGHIJKLMNOPQRSTUVWXYZ123456
```

### Why two variables?
| Variable | Used by | Exposed to browser? |
|----------|---------|-------------------|
| `BLOCKFROST_PROJECT_ID` | Server-side API routes only | ❌ Never |
| `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID` | Client wallet modal only | ⚠️ Yes (rate-limited) |

> **Security note**: The `BLOCKFROST_PROJECT_ID` without `NEXT_PUBLIC_` is only available in Node.js server code (API routes). It is NEVER included in the browser JavaScript bundle.

---

## 4. Cardano Network

These should always be `preview` for the hackathon:

```env
CARDANO_NETWORK=preview
NEXT_PUBLIC_CARDANO_NETWORK=preview
```

Never change these to `mainnet` — real ADA would be at risk.

---

## 5. Final `.env.local` Example

```env
# Supabase (leave empty for demo localStorage mode)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Blockfrost Preview Testnet
BLOCKFROST_PROJECT_ID=previewYOURKEYHERE
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=previewYOURKEYHERE

# Network
CARDANO_NETWORK=preview
NEXT_PUBLIC_CARDANO_NETWORK=preview
```

---

## 6. Runtime Behaviour Without Variables

| Variables missing | App behaviour |
|-------------------|--------------|
| All missing | Demo Mode — localStorage, no real transactions |
| Supabase missing | localStorage DB fallback, Cardano still works |
| Blockfrost missing | Registration modal shows setup error, Demo Mode |
| Both missing | Full demo mode — no real blockchain interaction |

---

## 7. Security Rules

- ✅ `.env.local` is in `.gitignore` — never commit it
- ✅ `BLOCKFROST_PROJECT_ID` is server-side only
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is server-side only
- ❌ Never hardcode keys in source files
- ❌ Never log keys to the console
- ❌ Never share `.env.local` via Slack, email, or chat

---

*LaunchNest | India Codex'26 | Team DecentraCoders*
