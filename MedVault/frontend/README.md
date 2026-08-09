# MediVault — Frontend

Privacy-preserving, yield-generating health insurance on Midnight + Cardano.
Next.js 15 · React 19 · Tailwind CSS v4 · Framer Motion · Recharts · Lucide.

## Run it

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Requires the backend running (see `../backend/README.md`) — `NEXT_PUBLIC_API_URL` in `.env.local` points at it (defaults to `http://localhost:8000/api/v1`).

## Portals & logins

| Role | Entry point | Lands on | Auth |
|---|---|---|---|
| User | `/auth/login` (or Register → Onboarding) | `/dashboard` | Real — backend JWT (register or log in with any account you create) |
| Platform admin | `/admin-auth/login` | `/admin` | Real — backend JWT, account must have `role=ADMIN` (see `backend/scripts/create_admin.py`) |
| Hospital admin | `/hospital-auth/login` → MFA | `/hospital` | Mocked — any credentials work; the hospital backend isn't built yet |

Footer of the landing page links to the hospital and admin portals.
User/admin sessions are real JWTs (access + refresh, restored via `/users/me`); the hospital session is a mock kept in `localStorage`. Sign out from the sidebar to switch roles.
Route protection redirects wrong-role visitors to their own portal.

## Structure

```
src/
├── app/                  # Routes (App Router)
│   ├── page.tsx          # Landing
│   ├── auth/             # User auth: login, register, verify, onboarding
│   ├── hospital-auth/    # Hospital login, registration request, MFA (mock)
│   ├── admin-auth/       # Admin login
│   ├── dashboard/        # User portal — wired to the real API
│   ├── hospital/         # Hospital portal — UI complete, backend still mock
│   └── admin/            # Platform admin portal — wired to the real API
├── components/
│   ├── ui/               # Primitives: button, card, table, dialog, tabs, toast…
│   ├── shared/           # Shell, sidebar, stat cards, timeline, settings blocks
│   └── charts/           # Recharts wrappers (area, donut, bar)
└── lib/
    ├── api.ts            # Real API client — single point of change if the backend URL/shape changes
    ├── auth.tsx          # Real JWT auth (user/admin) + mock hospital session; RequireRole guard
    ├── mock-data.ts       # Remaining mock data — only the hospital portal still reads from this
    ├── format.ts         # ADA/date formatting
    └── utils.ts          # cn() class merger
```

## What's real vs. mock right now

- **Real (backend-wired):** login/register, wallet linking, buying a plan, premium payment, claims + ZK-style proof flow, treasury/pool view, admin claim approval and payout, admin treasury allocation, audit log.
- **Still mock:** hospital portal (entire backend), profile edit, notifications feed, pool history chart (shows current snapshot, not a real time series). Tracked as the remaining backend work.
