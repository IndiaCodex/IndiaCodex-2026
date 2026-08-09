# Plan: Milestone 1 — Launch + single-UTXO bonding curve (Aiken + Mesh/Next.js on Preprod)

**Status:** In progress — Steps 1–3 done; launch verified on-chain (tx d9a7345f…); bonding-curve validator done; off-chain trading UI next
**Created:** 2026-07-12

## Implementation progress
- **[DONE] Step 1 — Scaffold.** `contracts/` = Aiken project (`aiken new`, stdlib v3.1.0, compiles via `aiken check`). `apps/web/` = **Next.js 14.2.35 + React 18** created with `create-next-app@14` (TS, Tailwind v3, App Router, `src/`, `@/*` alias). Root `.gitignore`, `apps/web/.env.example`, and `README.md` written. `npm run build` succeeds and `npm run dev` serves HTTP 200 with the wallet connect UI.
  - **Deviation — Mesh CLI:** `npx meshjs` (the scaffolder named in the plan) is **broken** on this setup (fails to rename `package.json`, aborts install). Used `create-next-app@14` + manual Mesh install instead. Do not retry `npx meshjs`.
  - **Deviation — pinned versions:** installed **`@meshsdk/core@1.8.14` + `@meshsdk/react@1.8.14`** (an aligned stable pair). Rationale: `@meshsdk/core` has **no** stable 2.x; `@meshsdk/react@latest` is `2.0.0-beta.2` which pulls `@meshsdk/wallet@2.x` while core stays on `wallet@1.x` — a real major mismatch. 1.8.14 keeps `common`/`wallet`/`transaction` aligned. Kept React 18 / Next 14 (Mesh's documented target) rather than bleeding-edge Next 16/React 19. **Pin these; do not `npm update` Mesh.**
  - **Required `next.config.mjs` fixes (applied):** (1) webpack `experiments` for `asyncWebAssembly`/`layers`/`topLevelAwait`; (2) alias `libsodium-wrappers-sumo` → its CommonJS build (its ESM `import` entry references an unpublished `./libsodium-sumo.mjs`).
  - **Client-only Mesh pattern (applied):** Mesh's WASM (`sidan_csl_rs_bg.wasm`) cannot run during Next server prerender. `MeshProvider` (`src/app/providers.tsx`) and the wallet UI (`src/components/LaunchpadHome.tsx` via `src/app/page.tsx`) are both loaded with `next/dynamic` `ssr:false`. **Any future module importing `@meshsdk/*` must stay behind an `ssr:false` boundary** or the build breaks.
  - **Aiken PATH:** binary lives at `~/.aiken/bin/aiken` (not on PATH in this env — invoke by full path or add to shell profile).

- **[DONE] Step 2 — Aiken CIP-68 minting policy.** `contracts/validators/launchpad_mint.ak` + logic/tests in `contracts/lib/launchpad/mint.ak`. Parameterized by a `seed` OutputReference (one-time policy → fixed supply). Enforces: seed UTxO consumed + exactly two assets minted (reference qty 1, user qty 1e9). **5 unit tests pass** (`aiken check`), `aiken build` → `contracts/plutus.json` (validator `launchpad_mint.mint`, Plutus V3, param `seed`). Verified the blueprint's `OutputReference` is the unwrapped V3 shape `Constr 0 [ByteArray, Int]` and Mesh's `mOutputReference` matches it exactly.
- **[DONE] Launch (mint) off-chain + UI.** `apps/web/src/lib/`: `contract.ts` (loads blueprint, `applyParamsToScript` with the seed, derives policy id + CIP-68 `100`/`222` units, `TOTAL_SUPPLY=1e9`), `provider.ts` (Blockfrost Preprod from `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID_PREPROD`), `launch.ts` (`MeshTxBuilder` mints ref `100` w/ inline `metadataToCip68` datum + user `222` full supply, spends the seed, wallet signs + submits). `components/LaunchForm.tsx` wired into `LaunchpadHome` (shows once wallet connected). `npm run blueprint` copies the blueprint. **typecheck + `npm run build` + dev serve all green.**
  - **NOT YET VERIFIED on-chain:** no real Preprod mint has been executed (needs a Blockfrost Preprod key in `apps/web/.env.local` + a faucet-funded wallet with collateral). Acceptance criteria for launch remain unchecked until an actual mint confirms.
  - **Deferred to remaining steps:** this mints tokens **to the wallet** — it does NOT yet create the bonding-curve pool UTxO or wire buy/sell (steps 3, 6–9). Pool creation will be folded into the launch tx once the curve validator exists.

- **[VERIFIED] Launch mint on-chain.** Tx `d9a7345f2866619447b2b7bbef4b80e436e5d1444e60f27f7f3932ad701d3bb6` on Preprod: `valid_contract: true`, policy `3f9c3bb0…191d755`, reference NFT (label 100) qty 1 **with inline datum**, user token (label 222 "PEPE") qty 1e9. Fix that unblocked submission: Mesh 1.8.14's bundled Preprod cost models are stale (PlutusV3 now 350 params) → `ScriptIntegrityHashMismatch`; `launch.ts` now fetches live `cost_models_raw` from Blockfrost and passes them via `setNetwork(number[][])`. **Reusable trap for all Plutus txs in this repo.**
- **[DONE] Step 3 — Bonding-curve validator.** `contracts/validators/bonding_curve.ak` + logic/tests in `contracts/lib/launchpad/curve.ak`. `PoolDatum {token_policy, token_name, sold, reserve, m, c}`, `Buy{amount}`/`Sell{amount}`. Enforces exactly one continuing pool output, immutable curve params/token identity, exact integer integral `cost = m*(sold*Δ + Δ*(Δ-1)/2) + c*Δ` (no rounding needed — exact), reserve/lovelace/token deltas, and bounds (`sold+Δ ≤ 1e9`, `Δ ≤ sold`). **6 unit tests pass** incl. underpay, oversell, and param-tamper rejection. `aiken build` → blueprint has `bonding_curve.spend` + `launchpad_mint.mint`; copied to `apps/web/src/data/plutus.json`.
  - **Note:** the pure linear integral with integer `m`,`c` is **exact** — the "round in pool's favor" trap does not arise here (no division by non-exact terms).
- **[BUILT, on-chain trades unverified] Pump.fun marketplace.** Design pivoted (user): tokens trade ONLY on our curve until **80% of supply sold**, then graduate to Minswap (gate now, Minswap wiring later). Curve validator got a graduation gate: `Graduate` redeemer (owner-signed, `sold ≥ 80%`), buys capped at 80%, sells locked at 80%; `PoolDatum` gained an `owner` key. 9 Aiken tests pass. Off-chain (`apps/web/src/lib/`): `contract.ts` (curve address/hash, `PoolDatum` encode/decode, constants), `curve.ts` (bigint `cost`/`priceAt` mirroring Aiken), `launch.ts` refactored to **mint the supply into a pool UTxO** at the curve address, `pool.ts` (reads all pools at the one curve address = the marketplace registry, decodes datums), `trade.ts` (`buyTokens`/`sellTokens`/`graduatePool` spending the pool with V3 script + live cost models). UI: `Marketplace.tsx` (token list, price, progress-to-graduation bar, buy/sell, owner graduate button), `LaunchForm.tsx` (+ m/c). typecheck + build + dev serve green. **tsconfig target bumped to ES2020** (bigint literals).
  - **NOT YET VERIFIED on-chain:** no real pool launch/buy/sell executed — needs testing (first Plutus-spend runs may need tweaks, as the mint did).
  - **Deferred:** actual Minswap pool creation at graduation (currently `Graduate` releases reserve+tokens to the owner). Live graduation isn't practically demoable (80% of 1e9 = 800M tokens is unreachable with faucet ADA at sane curve params) — the gate + progress bar demonstrate the mechanism.

## Superseded TODO (kept for history)
- **[TODO] Marketplace off-chain + UI (steps 5–9).** Refactor launch to deposit supply into a pool UTxO at the curve address (mint-into-pool) instead of the wallet; TS `curve.ts` mirroring `cost`; `buy.ts`/`sell.ts`; `pool.ts` to read all pools at the one curve script address (= the marketplace registry, no DB) + derive price; marketplace/trade UI. The already-minted PEPE is in the wallet (pre-pool) — a fresh launch will create a tradeable pool.

## Goal & context
Build the first end-to-end vertical slice of a Cardano meme-coin launchpad: a user connects a browser wallet on **Preprod**, **launches** a native token (minted under a custom Aiken policy with **CIP-68** on-chain metadata), and then anyone can **buy and sell** that token against a **linear bonding curve** `price = m * supply + c`, where buying raises the price and selling lowers it. This milestone proves the whole toolchain (Aiken → blueprint → Mesh off-chain → Next.js UI → real wallet → Blockfrost) **and** the core curve economics in one build.

To keep the first curve implementation tractable, the pool state lives in **a single UTXO** and users trade **directly** against it. This is knowingly subject to the eUTXO **concurrency limit** — only one buy/sell can settle per block, and racing transactions fail and must be retried. Solving that (order UTXOs + batcher) is explicitly a **later** milestone; this one accepts the limit so the curve math and datum-continuity design are proven first.

The repository is currently **empty** (greenfield). This plan scaffolds it and deliberately reuses existing tooling (per the Cardano tools directory review): Mesh SDK for wallet + tx-building + CIP-68 helpers, Blockfrost as the provider, and the Cornucopias `mint-contract` as an Aiken CIP-68 reference.

### Key design decision — token supply model (chosen: pre-mint to pool)
At launch, the policy mints a **fixed `max_supply`** of the user token **once** and deposits the **entire supply into the pool UTXO**; the pool datum tracks `sold` (tokens released so far), and pricing uses `supply := sold`. Buys move tokens **out** of the pool to the buyer and ADA **in**; sells do the reverse. **Trades are pure spends of the pool UTXO — no minting/burning happens on trade**, so the minting policy stays one-time and the curve validator is a self-contained swap validator. The alternative (mint-on-buy / burn-on-sell, unbounded supply) is recorded in Open questions; it is economically equivalent for a linear curve but couples the minting policy to every trade and is deferred.

## Acceptance criteria
- [ ] `cd contracts && aiken check` passes with unit tests for **both** validators (minting policy + bonding curve), and `aiken build` produces `contracts/plutus.json` containing both compiled validators.
- [ ] The web app (`npm run dev` in `apps/web`) renders: a Mesh **Connect Wallet** control, a **Launch** form (name, ticker, description, image URL, `m`, `c` — `max_supply` is the fixed 1e9 constant, not an input), and a **Trade** panel (buy amount / sell amount) with a **live price** display.
- [ ] **Launch:** connecting a Preprod wallet and submitting the launch form builds/signs/submits **one** transaction that (a) mints the CIP-68 reference NFT (`100`) + the full `max_supply` (1,000,000,000) of the user token (`222`) under one policy whose id equals the compiled Aiken policy hash, and (b) creates the **pool UTXO** at the bonding-curve script address holding all 1e9 user tokens with datum `{sold: 0, reserve: 0, m, c, max_supply: 1_000_000_000, fee_bps: 0, ...}`. Returns a tx hash + explorer link.
- [ ] **Buy:** submitting a buy for `Δ` tokens builds/signs/submits one transaction that spends the pool UTXO and re-creates it with `sold' = sold + Δ` and `reserve' = reserve + cost`, sends `Δ` tokens to the buyer, and is **accepted by the on-chain validator**; `cost` equals the integer curve integral (below). After confirmation the displayed price has **increased**.
- [ ] **Sell:** submitting a sell for `Δ` tokens builds/signs/submits one transaction that spends the pool UTXO + the seller's `Δ` tokens, re-creates the pool with `sold' = sold − Δ` and `reserve' = reserve − refund`, pays `refund` ADA to the seller, and is accepted on-chain. After confirmation the displayed price has **decreased**.
- [ ] The off-chain `cost`/`refund` computed by the app **exactly equals** the on-chain validator's computation for the same inputs (proven by the tx validating — a mismatch fails the script).
- [ ] The **live price** shown in the UI is derived from the current pool UTXO datum read via Blockfrost as `price = m * sold + c` (in lovelace), and updates after each confirmed trade.
- [ ] `README.md` documents prerequisites, Blockfrost Preprod key, faucet funding, build commands, and the launch→buy→sell walkthrough.

### Curve math (integers only, lovelace)
Buying `Δ` tokens when `sold = s` costs the area under the line:
`cost(s → s+Δ) = m*(s*Δ + Δ*(Δ−1)/2) + c*Δ`. Selling `Δ` at `sold = s` refunds `cost(s−Δ → s)`. All arithmetic is integer; **`cost` rounds up and `refund` rounds down (always in the pool's favor)**; `m`, `c` are pre-scaled integers (see Known traps).

## In scope
- Monorepo scaffold: `contracts/` (Aiken) + `apps/web/` (Next.js + Mesh) + `docs/`.
- **Aiken minting policy** (CIP-68): one-time mint of reference token `100` + full `max_supply` of user token `222` under one policy, parameterized by a consumed UTxO for uniqueness.
- **Aiken bonding-curve validator**: pool datum + `Buy`/`Sell` redeemers; validates continuing output, datum transitions, integer curve math, token/ADA deltas, bounds, and rounding direction.
- Aiken unit tests for both validators (`aiken check`).
- Off-chain (Mesh): blueprint loading + param application; **launch** tx (mint + create pool UTXO); **buy** tx; **sell** tx; identical off-chain integer curve math; pool-datum reader + price derivation.
- Next.js UI: `MeshProvider`, `CardanoWallet`, launch form, trade panel, live price, tx-hash/error surfacing, Preprod network assertion.
- Config: Blockfrost Preprod key + network id `0` via env; `.env.example`; `README.md`.

## Out of scope (do NOT build in this milestone)
- **Order UTXOs, the batcher/scooper service, transaction chaining, Kupo/Ogmios indexing** — i.e. do **not** solve the concurrency problem here. The single-UTXO pool with direct spends is intentional; racing-tx failure is an accepted limitation.
- **Mint-on-demand / burn-on-sell supply model** (the deferred alternative) — this milestone pre-mints a fixed supply.
- **DEX / Minswap graduation**, migrating liquidity out of the curve.
- **Yaci DevKit / local devnet** — Preprod only.
- **CIP-68 metadata update/reveal** after mint.
- **Mainnet** deploy or mainnet keys.
- **Backend server, database, user accounts, auth** — client-side + Blockfrost only.
- **Token discovery/browse page, portfolio, charts/history** — only launch + trade of a single token the user is acting on.
- **Slippage protection beyond a simple min-out/max-in guard** in the trade builders (a basic guard is fine; advanced MEV/slippage UX is out).

## Decisions already made
- **Off-chain library:** Mesh SDK (`@meshsdk/core`, `@meshsdk/react`).
- **Network + provider:** Preprod + Blockfrost (real Eternl/Lace wallets, faucet).
- **Frontend:** Next.js scaffolded via `npx meshjs`.
- **On-chain language:** Aiken, compiled to a CIP-57 blueprint.
- **Metadata:** CIP-68 (reference `100` + user `222`, inline datum).
- **Supply model (RESOLVED):** pre-mint fixed `max_supply` into the pool; datum tracks `sold`; trades are pure spends (no mint/burn on trade). Rationale: keeps the minting policy one-time and the curve validator self-contained; economically identical to mint-on-demand for a linear curve.
- **Total supply (RESOLVED):** `max_supply` is a **fixed protocol constant of 1,000,000,000 tokens (1e9)** for every token — NOT user-configurable in M1. Decimals are `0` for M1 (on-chain amount = whole-token count = 1e9 base units); a 6-decimals display convention can be added later via CIP-68 metadata without changing the curve. The validator enforces `sold + delta <= 1_000_000_000`.
- **Fee model (RESOLVED):** **no fee** in M1. The `fee_bps` datum field is present and set to `0` (reserved) so fees can be added later without a datum migration; buy `cost` and sell `refund` are the pure curve integral with no treasury output.
- **Pricing basis:** `supply := sold` (circulating tokens released from the pool); price in **lovelace**; `m`, `c` pre-scaled integers.
- **Rounding:** always in the pool's favor (`cost` up, `refund` down).
- **Concurrency:** single pool UTXO, direct spends; the one-tx-per-block limit is accepted for this milestone.
- **Reuse over rebuild:** Mesh CIP-68 helpers + Cornucopias Aiken reference; do not hand-roll CIP-68 encoding.

## Open questions
- [ ] **Reference NFT (label 100) destination:** user's wallet (simplest) vs a dedicated script address (more standard). Deferred to implementation; default to the wallet and record the choice in the README. (Does not affect the curve.)

_Resolved 2026-07-12:_ **Supply model** → pre-mint fixed `max_supply` (see Decisions). **Fee model** → no fee in M1, `fee_bps` reserved `= 0` (see Decisions).

## Files to read first
Greenfield — read these external references before writing code:
- `https://meshjs.dev/guides/aiken` — canonical Aiken→Mesh flow (`aiken new`/`build`, `plutus.json`, blueprint loading). **Source of truth for the current Mesh loading API** (it moves fast; prefer it over this plan's snippets).
- `https://meshjs.dev/apis/txbuilder/minting` — Mesh minting + **CIP-68 helpers** (`CIP68_100`, `CIP68_222`, `metadataToCip68`, `.txOutInlineDatumValue`, `applyParamsToScript`, `resolveScriptHash`, `.mint`, `.mintingScript`, `.mintRedeemerValue(mConStr0([]))`).
- `https://meshjs.dev/apis/txbuilder` — spending a Plutus-script UTxO (`spendingPlutusScriptV2`/V3, `.txInScript`, `.txInRedeemerValue`, `.txInDatumValue`) needed for buy/sell against the pool, plus reading the input datum.
- `https://github.com/Cornucopias/mint-contract` — working Aiken CIP-68 minting contract to mirror.
- `https://aiken-lang.org/` (Getting Started, stdlib `cardano/transaction`, `cardano/assets`) — **current** Aiken syntax and value/asset helpers. Do NOT copy older `aiken/transaction` snippets (see Known traps).
- `https://cips.cardano.org/cip/CIP-68` — datum structure and `100`/`222` label rules.
- `https://sundae.fi/posts/concurrency-state-cardano` — why a single shared pool UTXO contends; context for the accepted limitation and the next milestone.

## Codebase conventions to honor
No code exists yet; this milestone **establishes** conventions later milestones must follow:
- **Layout:** on-chain in `contracts/`, web app in `apps/web/`, docs in `docs/`.
- **Single blueprint source:** `contracts/plutus.json` is the build artifact; the app consumes a **copy** at `apps/web/src/data/plutus.json` via a documented npm script (never hand-edit the copy).
- **Curve math lives in exactly one TS module** (`apps/web/src/lib/curve.ts`) reused by buy, sell, and price display, and it must mirror the Aiken formula **bit-for-bit** (same integer rounding). Do not duplicate the formula inline.
- **Network is configuration:** Blockfrost key + network id (`0` = Preprod) from env, threaded through provider, address derivation, and a wallet-network assertion. No mainnet literals.
- **Secrets via env only:** `.env.local` (git-ignored) + committed `.env.example`.
- **TypeScript**, matching the Mesh scaffold; keep tx-building logic in `apps/web/src/lib/` separate from React components.

## Reference anchors (imitate these)
- `https://github.com/Cornucopias/mint-contract` — Aiken CIP-68 validator structure + metadata datum encoding (adapt NFT → fungible `max_supply`).
- Mesh CIP-68 example on `https://meshjs.dev/apis/txbuilder/minting` — exact mint call sequence and inline-datum attachment.
- Mesh script-spend example on `https://meshjs.dev/apis/txbuilder` — mirror for spending the pool UTxO in buy/sell (redeemer + inline datum + continuing output).
- Mesh Aiken guide `https://meshjs.dev/guides/aiken` — `MeshProvider`/`CardanoWallet` wiring (use current APIs).

## Change surface
| File | Action | Purpose |
|------|--------|---------|
| `contracts/aiken.toml` | create (`aiken new`) | Aiken project manifest |
| `contracts/validators/launchpad_mint.ak` | create | CIP-68 one-time minting policy (ref `100` + full `max_supply` `222`) |
| `contracts/validators/bonding_curve.ak` | create | Pool spend validator: `Buy`/`Sell`, datum transitions, curve math |
| `contracts/lib/**` (types, math) | create | shared `PoolDatum`/redeemer types + integer curve function + tests |
| `contracts/plutus.json` | generate (`aiken build`) | blueprint consumed off-chain |
| `apps/web/` (Next.js scaffold) | create (`npx meshjs`) | web app: MeshProvider + CardanoWallet + Tailwind |
| `apps/web/src/data/plutus.json` | create (copy) | blueprint the app loads |
| `apps/web/src/lib/contract.ts` | create | load blueprint, apply params, derive policy id + pool script address |
| `apps/web/src/lib/curve.ts` | create | integer curve math (mirrors Aiken); used by buy/sell/price |
| `apps/web/src/lib/pool.ts` | create | read pool UTxO + datum via Blockfrost; derive current price |
| `apps/web/src/lib/launch.ts` | create | build launch tx (mint + create pool UTxO) |
| `apps/web/src/lib/buy.ts` | create | build buy tx (spend pool, pay ADA, receive tokens, continue pool) |
| `apps/web/src/lib/sell.ts` | create | build sell tx (spend pool + tokens, refund ADA, continue pool) |
| `apps/web/src/lib/provider.ts` | create | Blockfrost Preprod provider from env |
| `apps/web/src/components/LaunchForm.tsx` | create | launch inputs + submit + result |
| `apps/web/src/components/TradePanel.tsx` | create | buy/sell inputs + live price + result |
| `apps/web/src/pages` or `app/` root | modify | mount MeshProvider, CardanoWallet, Launch + Trade |
| `apps/web/.env.example` | create | `BLOCKFROST_PROJECT_ID_PREPROD`, `NETWORK` |
| `README.md` | create | setup, faucet, build/run, launch→buy→sell walkthrough |
| `.gitignore` | create | ignore `.env.local`, `node_modules`, Aiken build artifacts |

## Ordered task breakdown
1. **Scaffold the monorepo** — `aiken new <org>/launchpad` in `contracts/`; `npx meshjs web` in `apps/`; root `.gitignore` + empty `README.md`.
   - Verify: `aiken -V` prints a version; `apps/web` serves the default page via `npm run dev`.
   - Checkpoint: no
2. **Aiken CIP-68 minting policy** — `launchpad_mint.ak`: one-time policy (param UTxO) minting reference `100` + full `max_supply` user `222` under one policy; correct labels/asset names. Current Aiken syntax.
   - Verify: `aiken check` unit tests — valid mint passes; wrong labels / missing param UTxO / wrong quantity fail.
   - Checkpoint: yes (security-critical; review before proceeding)
3. **Aiken bonding-curve validator** — `bonding_curve.ak` + `lib` math: `PoolDatum {token_policy, token_name, sold, reserve, m, c, fee_bps, max_supply, ...}`; `Buy{delta}`/`Sell{delta}` redeemers. Assert exactly one continuing pool output at the same script address; correct datum transition; `reserve`/`sold` deltas match the **integer** `cost`/`refund`; pool token balance changes by exactly `delta`; bounds (`delta>0`, `sold+delta<=max_supply` on buy, `delta<=sold` on sell); rounding in pool's favor; only the intended pool UTxO is consumed (guard double-satisfaction).
   - Verify: `aiken check` tests — a correct buy and a correct sell pass; underpaying a buy, overpaying a sell refund, mutating an immutable datum field, omitting the continuing output, and out-of-bounds `delta` all fail.
   - Checkpoint: yes (most complex, value-bearing logic — review before wiring off-chain)
4. **Build blueprint + wire loader** — `aiken build`; copy `plutus.json` to the app (npm script); implement `contract.ts` (apply params, derive minting policy id + pool script address).
   - Verify: a scratch run prints a stable policy id + pool address derived from the blueprint that match `resolveScriptHash`/`resolvePlutusScriptAddress`.
   - Checkpoint: no
5. **Curve math module (TS) + parity test** — `curve.ts` implementing `cost`/`refund` identically to Aiken; add a small TS test comparing outputs against hand-computed values from the Aiken tests.
   - Verify: TS test matches the Aiken test vectors exactly (same rounding).
   - Checkpoint: no
6. **Launch tx builder** — `launch.ts`: mint `100`+`222`, attach CIP-68 inline datum, deposit all `max_supply` user tokens into the pool UTxO at the pool script address with initial datum `{sold:0, reserve:0, ...}`, send reference NFT per the open-question default.
   - Verify: on Preprod, a launch tx confirms; the pool UTxO exists at the script address holding `max_supply` tokens with the expected datum (read via Blockfrost / Datum Explorer).
   - Checkpoint: no
7. **Buy + sell tx builders** — `buy.ts`/`sell.ts`: read current pool UTxO + datum (`pool.ts`), compute `cost`/`refund` via `curve.ts`, spend the pool with the right redeemer, re-create the continuing pool UTxO with updated datum + adjusted token/ADA balances (respecting min-ADA for the tokens remaining), pay the counterparty, add a basic max-in/min-out guard.
   - Verify: on Preprod, a buy confirms and the pool datum shows `sold`/`reserve` increased; a subsequent sell confirms and they decrease; both are accepted by the validator.
   - Checkpoint: no
8. **UI: launch form + trade panel + live price** — mount `MeshProvider`/`CardanoWallet`; `LaunchForm` and `TradePanel`; derive and display `price = m*sold + c` from `pool.ts`; show tx hashes/errors; assert wallet is on Preprod.
   - Verify: local run — connect wallet, launch, buy (price ticks up), sell (price ticks down), each showing a tx hash.
   - Checkpoint: no
9. **End-to-end on Preprod + docs** — full walkthrough launch→buy→sell with a faucet-funded wallet; confirm all Acceptance criteria (policy-id match, on-chain datum, price direction, off/on-chain math parity). Write `README.md` + `.env.example`.
   - Verify: every Acceptance criterion passes.
   - Checkpoint: yes (first full economic flow on-chain; confirm before declaring done)

## Verification
- **Tests to add:** Aiken `test`s for the minting policy (task 2) and the bonding-curve validator (task 3, covering buy, sell, and each failure mode); a TS parity test for `curve.ts` vs the Aiken vectors (task 5).
- **Existing tests that must still pass:** none yet; ensure `npm run build` in `apps/web` succeeds after edits.
- **Manual checks:** (1) launch tx confirms; pool UTxO holds `max_supply` with datum `{sold:0,reserve:0}`; (2) policy id == compiled Aiken hash; (3) reference `100` datum decodes to metadata; (4) buy increases `sold`/`reserve` and the displayed price; (5) sell decreases them; (6) an intentionally-underpaid buy is rejected on-chain (proves the validator guards the curve).

## Known traps
- **Off-chain and on-chain math must match exactly.** The validator recomputes `cost`/`refund` and rejects if the tx's deltas don't match. Any divergence in integer rounding, scaling of `m`/`c`, or operator order between `curve.ts` and the Aiken function fails every trade. Keep both formulas identical and rounding explicit (`cost` up, `refund` down).
- **Rounding must favor the pool.** Rounding the wrong way lets a trader extract value across many trades. Round `cost` up and `refund` down, and unit-test the boundary (e.g. `Δ=1`, small `s`).
- **Pool min-ADA shifts as tokens leave.** The pool UTxO must always carry `reserve` **plus** the min-ADA required for the tokens still in it; as tokens flow out on buys and ADA flows in, recompute the output's min-ADA or the tx fails ledger rules. Don't hard-code the pool's lovelace to just `reserve`.
- **Continuing-output / double-satisfaction.** The validator must require **exactly one** continuing pool output at its own script address with the correct datum, and guard against a tx that consumes the pool while satisfying checks with an unrelated output. Derive "own address" from the spent input; reject extra pool outputs.
- **Stale Aiken syntax.** Older guides use `use aiken/transaction.{ScriptContext}` / `validator { fn }`; current Aiken uses `use cardano/transaction` + handler-style validators and `cardano/assets` for value math. Follow current aiken-lang.org or the build breaks.
- **Double-CBOR-wrapping the compiled code** yields a wrong policy id / script address that won't match on-chain. Use Mesh's current `applyParamsToScript`/`serializePlutusScript` flow and verify the derived policy id + pool address against a first on-chain artifact before building UI on top.
- **CIP-68 pairing:** reference `100` + user `222` share one policy id and asset-name body; metadata is an **inline datum** in the exact CIP-68 structure. Use `metadataToCip68`.
- **Concurrency (accepted).** With one pool UTxO, two trades in the same block collide; one wins, the other's tx becomes invalid and must be rebuilt against the new pool UTxO. Surface a clear "pool changed, retry" error in the UI rather than silently failing — but do **not** build the batcher here.
- **Plutus tx needs collateral + min-ADA; wallet on Preprod.** Fund with faucet; ensure a pure-ADA collateral UTxO exists; Blockfrost key and wallet must both be Preprod (network id `0`).

## Risks & rollback
- **Risk:** on/off-chain math parity is hard to get exactly right and every trade fails the validator.
  **Rollback / mitigation:** land task 5's parity test **before** any on-chain trade; if a mismatch appears, diff `curve.ts` against the Aiken `test` vectors rather than debugging on-chain. Nothing deployed → `git revert`.
- **Risk:** bonding-curve validator has a value-leak bug (rounding/continuing-output).
  **Rollback / mitigation:** the failure modes in task 3's tests must all be red-then-green; if a leak is found post-integration, disable the Trade panel (launch still works) and fix the validator on a branch. Preprod only, no real value at risk.
- **Risk:** Mesh/Aiken API drift (V2 vs V3, blueprint loading) blocks minting or spending.
  **Rollback / mitigation:** the UI is decoupled from tx internals; if the Aiken path stalls, prove the flow with a simpler validator while fixing, and treat the full policy/curve as a branch. Revert via git.
- **Risk:** Preprod/Blockfrost/faucet flakiness stalls verification.
  **Rollback / mitigation:** retry with a second Blockfrost key / alternate faucet; environment retry, not a code change.
