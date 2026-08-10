# Demo-day runbook

Turnkey steps for the day. The build is done; this is how you run it, go on-chain, and present. Pairs
with [`6hr-sprint.md`](./6hr-sprint.md) (2-min script) and [`pitch-and-risks.md`](./pitch-and-risks.md) (Q&A).

---

## 0. One-time setup (do this before the demo)

### A. Run the demo (no chain — always works)
```bash
cd demo-app
npm install          # first time only
npm run dev          # http://localhost:3000
```
That's it — demo mode needs no keys. `npm test` runs the 27 tests; `cd ../on-chain && aiken check` runs the 13.

### B. Go on-chain for the live settlement (two manual gates)
1. **Fund the wallet.** The generated Preprod wallet address is in `demo-app/.env.local` (commented
   `# Wallet address: addr_test1…`). Paste it into the faucet
   (https://docs.cardano.org/cardano-testnets/tools/faucet — has a captcha). **Do this early; it lags.**
2. **Blockfrost key.** Create a **Preprod** project at blockfrost.io → paste the id into
   `demo-app/.env.local` `BLOCKFROST_PROJECT_ID`.
3. **Seed tickets + smoke test:**
   ```bash
   cd demo-app
   npm run seed        # seeds ~10 Open ticket UTXOs at the script address
   npm run claim       # single-claim smoke test → prints a Cardanoscan link
   ```
   If `npm run claim` confirms, the full batch path works too.

> **Faster alternative (ADR-007):** with Docker, run **Yaci DevKit** (`create-node ... --start`,
> `topup <addr> 50000`) and point `BLOCKFROST_URL` at it — no faucet, no key, instant blocks. Do the final
> settlement on Preprod for the public Cardanoscan link.

---

## 1. Pre-flight (5 min before presenting)

- [ ] `npm run dev` up at localhost:3000 (dev mode avoids the stale-chunk gotcha below).
- [ ] If you used `npm run build` + `npm run start`: **restart it** and kill any stale process on `:3000`
      (`netstat -ano | grep :3000` → `taskkill //PID <pid> //F`) — a stale server serves old chunks → blank page.
- [ ] Browser zoom ~100–110%, window wide enough to show both panels.
- [ ] (On-chain) wallet funded, `npm run seed` run so fresh Open tickets exist; `SETTLEMENT_MODE` starts on `demo`.
- [ ] Backup video recorded (below).

---

## 2. The demo click-path (~2 min)

1. **Frame it (20s).** "On Cardano a UTXO is spendable by one tx at a time. Watch 24 people claim a shared pool."
2. **Fire Heavy contention.** The **fees-saved counter** climbs; **Naive vs Batched** shows `24 → 8 txs`,
   `₳6.00 → ₳2.78`. Scroll to the **contention graph** → dense red conflicts, green = the chosen batch.
3. **Show adaptivity (30s).** Drag the **Simulate congestion** slider up → score → `0.82 CONGESTED`, the batch
   window lengthens (queue stays fuller, graph denser). Drop it → clears fast. "The policy is real; on idle
   Preprod we drive the input."
4. **Go real (30s).** Flip **Settlement → real**, fire a small burst → a real Preprod settlement; click the
   **Cardanoscan link**. Flip back to `demo` for safety.
5. **Position + numbers (25s).** "Shared infra — like ERC-4337 bundlers, structurally necessary on Cardano.
   Measured on-chain limit N_max ≈ 30–35 per settlement; 13/13 on-chain + 27/27 off-chain tests." → Q&A.

Pitch deck: [`pitch-deck.html`](./pitch-deck.html) (arrow keys / scroll).

---

## 3. Record the backup video (insurance)
Run the click-path once in demo mode with a screen recorder (Windows: **Win+G** → Game Bar → Record, or OBS).
Keep it ~90s. If the live network misbehaves on stage, play this and narrate.

---

## 4. Fallback ladder (if something breaks live)
1. **Real settlement fails / Blockfrost throttles** → flip **Settlement → demo** (the counter/graph keep
   working from simulated data; the screen never blanks — verified) and say the real tx is the last mile.
2. **On-chain fully stuck** → show `aiken check` (13/13) + the deployed **script address** on Cardanoscan +
   the recorded video.
3. **Floor:** the whole client demo runs with zero chain access. It cannot break from a network issue.

---

## 5. Q&A cheat-sheet
Full answers in [`pitch-and-risks.md`](./pitch-and-risks.md) §7. The five you'll get:
- *"Isn't this what Minswap already does?"* — yes, privately + statically; nobody offers it as a shared adaptive layer.
- *"Why not wait for Leios?"* — base-layer vs app-layer; complementary, not near-term.
- *"What's on-chain?"* — the validator enforces batch validity + the **state-split** invariant (rule 6). Real eUTXO work.
- *"Does congestion need ML?"* — no, EWMA; we didn't fake a model.
- *"How big can a batch be?"* — measured: **N_max ≈ 30–35** (`aiken check` benchmark).
