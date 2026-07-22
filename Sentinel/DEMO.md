# Sentinel — 2-Minute Demo Script

A precise, second-by-second script. No improvisation. Rehearse it exactly as
written — the timing only works if the clicks and lines match what's below.

The 2-minute clock starts **after** the app is already running. Building and
seeding happens beforehand, untimed, per the setup section.

---

## Before you start (untimed — do this before your slot)

```bash
git clone <this-repo>
cd Sentinel
pnpm install
```

**Expected output:** dependency resolution, ending in `Done in ~5s` (from a
warm pnpm store; a fully cold install is slower — do this well before your
slot, not during it).

```bash
pnpm demo
```

**Expected output:** every package builds, then four scenarios seed in order.
Watch for this exact line twice — it's the moment that matters most in the
whole demo, so know it by sight:

```
[7] payment/completed — enriched via MasumiAdapterPort (masumiReference=masumi_tx_351b0dea5202)
```

Then:

```
[server] Sentinel server listening on 0.0.0.0:4000 (storage: sqlite)
[web]   ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in a browser, full-screen, zoomed so text is
readable from the back of the room. Confirm the Dashboard loads with 4
executions and dark theme. **Now start your timer.**

---

## The 2 minutes

| Time     | Click                                                                                     | Say                                                                                                                                                                                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0:00** | _(Dashboard already on screen)_                                                           | "This is Sentinel, running right now from one command — `pnpm demo`. Four real agent executions, captured, journaled, and verified live."                                                                                                                                 |
| **0:08** | Point at the **Execution Status Distribution** bar and the five stat tiles                | "Two failed, one running, one completed — and this Integrity Summary tile is a live number: three sealed executions, all independently re-verified, right now, not cached."                                                                                               |
| **0:20** | Click **Executions** in the sidebar                                                       | "Every execution ID here is distinguishable at a glance — search and filter work client-side, instantly."                                                                                                                                                                 |
| **0:30** | Click into the **subscription-renewal-agent** row (Failed)                                | "This agent tried to renew a subscription through Masumi and got declined. Everything from here is real captured data — nothing is scripted after the fact."                                                                                                              |
| **0:40** | Click the **Explainability** tab                                                          | "Engineering Mode — every field on this page is a deterministic function of recorded data. No AI, no natural-language generation, anywhere in this path."                                                                                                                 |
| **0:48** | Point at the **Failure Analysis** card                                                    | "Failed at sequence six: payment declined by Masumi Payment Service, insufficient funds. That's not a guess — it's read directly off the recorded event."                                                                                                                 |
| **0:55** | Scroll to **Payment Flow**, point at the **Masumi Reference** column                      | "And this — `masumi_tx_466353394142` — is a real Masumi reference, attached _live_, during capture, by Sentinel's `MasumiAdapterPort`. Not a mock bolted on afterward. It's there even on the payment that got declined."                                                 |
| **1:15** | Click the **Verification** tab                                                            | "Six independent checks, recomputed from nothing but the artifact itself — schema, ordering, identity, snapshots, hash chain, root hash. All passing. This isn't 'trust our database' — you could take this one JSON file and re-verify it yourself, offline, right now." |
| **1:35** | Click the **Artifact** tab → **Download JSON**                                            | "This is the whole audit trail in one portable file — artifact, hash chain, verification report, replay session, explanation. Sufficient on its own, no access to Sentinel required."                                                                                     |
| **1:50** | Navigate to **Executions** → **document-processing-agent** (Running) → **Explainability** | "And this one never finished — it's mid-run right now. Same replay, same verification, same explanation. Nothing in Sentinel requires an agent to be _done_ to be trustworthy. That's the whole point."                                                                   |
| **2:00** | _(end — hand off to Q&A)_                                                                 | —                                                                                                                                                                                                                                                                         |

---

## If something goes wrong

- **Port already in use / stale process:** `lsof -i :4000` and `lsof -i :5173`,
  kill whatever's holding them, restart `pnpm demo`. Do this check _before_
  your slot, not during it.
- **Live demo unavailable (no network, projector issue):** fall back to the
  screenshots in [`docs/screenshots/`](docs/screenshots/), in the same
  order as the table above (`03-execution-details.png` →
  `06-explainability.png` → `05-verification.png` → `07-export.png`), and
  narrate against the static images using the same script.
- **A judge interrupts with a question mid-script:** answer it, then say "let
  me pick back up here" and resume at the next row — don't restart from 0:00.

## Why this exact path

Every stop on this script is load-bearing, not decorative:

- The **declined** payment (not the successful one) is deliberate — it
  proves the Masumi reference is attached regardless of outcome, which is a
  stronger claim than showing it only on a happy path.
- **Verification before Artifact** — judges should see the integrity proof
  before the export, so "one portable file" reads as "one portable,
  _already-verified_ file," not just a JSON download.
- The **interrupted execution** closes the demo because it's the single
  strongest, most differentiated proof point Sentinel has: full assurance
  tooling on a run that never finished, which no logging or tracing tool
  offers by default.
