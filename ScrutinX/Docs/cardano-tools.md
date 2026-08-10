# Cardano tooling — what we use, what's optional, what's out of scope

Researched from the official directory at **https://developers.cardano.org/tools/** plus each tool's
primary docs. Organized by **relevance to THIS project**, not alphabetically. Every "use / consider /
skip" call has a one-line reason so you can defend it.

> **TL;DR stack:** Aiken (on-chain) · Lucid Evolution `@lucid-evolution/lucid` (off-chain) · Blockfrost
> (Preprod API) · **Yaci DevKit** (local devnet for fast iteration) · Koios (keyless backup API) ·
> Cardanoscan (explorer) · Lace Anatomy / Datum Explorer / Gastronomy (debugging).

---

## ⚠️ Naming clarification: "Lucid Evolution" vs "Evolution SDK"

The tools directory now lists these as separate entries — they are **different packages**, don't confuse them:

| Name | npm package | Who | Maturity | Use for us? |
|---|---|---|---|---|
| **Lucid Evolution** | `@lucid-evolution/lucid` | Anastasia Labs | Mature (v0.4.x), widely used, many examples | **✅ YES — primary for the hackathon.** Our code imports this. |
| **Evolution SDK** | `@evolution-sdk/evolution` | IntersectMBO / no-witness-labs | Newer, pure-TS on Effect, "Migration from Lucid" guide | Consider **post-hackathon**. Featured on developers.cardano.org but fewer examples — don't risk it in a 6h build. |

**Decision:** use **`@lucid-evolution/lucid`** (Anastasia Labs). It's battle-tested, has the most tutorials,
and everything in `off-chain/src/settlement.ts` already targets it. (ADR-001 in [`decisions.md`](./decisions.md).)

---

## TIER 1 — Core stack (we use these)

| Need | Tool | Why this one | Link |
|---|---|---|---|
| On-chain validator | **Aiken** | Purpose-built, Rust-like, compiles to UPLC; `aiken check` runs on the real VM + reports ExUnits (our batch-size benchmark). | /tools/aiken/ |
| Off-chain tx building | **Lucid Evolution** (`@lucid-evolution/lucid`) | Explicit low-level control for our multi-input batch redeemer; Blockfrost provider + seed wallet + Preprod out of the box. | /tools/lucid/ |
| Chain data + submit (public testnet) | **Blockfrost** (Preprod project, free tier) | UTXO queries, block/epoch data (congestion), protocol params (fees), tx submit. Our `blockfrostClient.ts` targets its REST API. | /tools/blockfrost/ |
| Network | **Cardano Preprod** + official **faucet** | Public testnet → a real, verifiable Cardanoscan link for judges. Free test ADA. | — |
| Explorer | **Cardanoscan (Preprod)** | `https://preprod.cardanoscan.io/transaction/<hash>` — the on-screen proof during the demo. | — |

---

## TIER 2 — Strongly recommended (research surfaced these; adopt if time allows)

### 🌟 Yaci DevKit — local devnet (biggest time-saver)
**What:** spin up a local Cardano devnet in seconds (Docker / ZIP / NPM) with a built-in indexer,
explorer, and a **Blockfrost-compatible API**.
**Why it matters for a 6-hour build:**
- **No faucet wait** — fund any address instantly: `topup addr_test1... 50000`.
- **Sub-second blocks** — `create-node --block-time 0.2 --slot-length 0.2 -o --start` (200ms blocks), or
  default 1s. The whole seed → claim → settle loop is *seconds*, not minutes.
- **Reset in seconds** — rehearse the demo repeatedly with fresh Open tickets.
- **Drop-in for our client** — point `BLOCKFROST_URL` at Yaci's Blockfrost-compatible endpoint; no code
  change (our config is env-driven).
- **Congestion bonus** — because you control block time/size, you can generate *more realistic* congestion
  signals locally instead of only using the manual override.

**Tradeoff / recommended split:** Yaci is a *local* devnet — judges value a **public** testnet tx more.
So: **develop and rehearse on Yaci, do the final "money-shot" settlement on Preprod** for the public
Cardanoscan link. Best of both. (See ADR-007 in [`decisions.md`](./decisions.md).)
Link: /tools/yaci-devkit/ · https://devkit.yaci.xyz · MeshJS Yaci provider docs.

### Koios — free, keyless API (backup + rate-limit relief)
**What:** community-run REST (and GraphQL) query layer. **Free, no API key** for the public tier
(~5,000 req/day; 50,000 with free registration).
**Preprod base URL:** `https://preprod.koios.rest/api/v0`. Endpoints: `blocks`, `protocol_parameters`,
`address_utxos`, `submittx`.
**Use for us:** a **keyless fallback** for congestion block-reads (so a 30–50 request burst doesn't burn
Blockfrost's free-tier limit), and a backup submit path. Note: Koios request/response shapes differ from
Blockfrost (mostly POST with body filters), so it's **not** a drop-in swap for `blockfrostClient.ts` — treat
it as a secondary reader, not a primary replacement, for the 6h build. Link: /tools/koios/ · https://koios.rest.

### Debugging trio (pull in the moment something breaks)
| Tool | Use when | Link |
|---|---|---|
| **Lace Anatomy** | Decode/visualize an address, CBOR, or a whole tx that's failing to build/submit. | /tools/lace-anatomy/ |
| **Datum Explorer** | Confirm our `BatchDatum` CBOR encoding matches the on-chain CDDL (datum mismatch = silent script fail). | /tools/datum-explorer/ |
| **Gastronomy** | Step **forward/backward** through the validator's UPLC execution when it rejects unexpectedly. | /tools/gastronomy/ |
| **cardano-cli** | Ad-hoc key/address/tx inspection. | /tools/cardano-cli/ |

---

## TIER 3 — Optional / stretch-goal enablers

| Tool | What it unlocks for us | Verdict |
|---|---|---|
| **Maestro** | Hosted API with **mempool monitoring** (pending txs), Preprod, free tier (API key). | The concrete path to the **real mempool-based conflict detection** stretch (ADR-003 said Blockfrost can't do it well). Name it as a next step; don't build it in 6h. /tools/maestro/ |
| **Mesh (MeshJS)** | React UI components/hooks for wallet + tx status; providers for Blockfrost/Koios/Maestro/**Yaci**. | We sign server-side (no browser wallet), so we likely don't need it. Optional UI sugar for the demo **frontend only** — never mix its tx-building with Lucid (AGENT.md §5). /tools/mesh/ |
| **Ogmios + Kupo** (or **Demeter** hosting them) | Self-hosted node WebSocket JSON-RPC + lightweight chain-index; alternative congestion/UTXO source. | Overkill for 6h — Blockfrost/Yaci cover us. Mention as a scaling option in the pitch. /tools/ogmios/ /tools/kupo/ |

---

## OUT OF SCOPE (know why we're not using them)

- **Plutarch / OpShin / Pebble** — alternative on-chain languages. We use **Aiken**; don't mix.
- **Hydra / hydra-sdk** — Layer-2 state channels. A *different* scaling approach; relevant only as
  "related work" in the pitch (we solve effective throughput at the app layer, not L2). Not built.
- **Evolution SDK (`@evolution-sdk/*`), PyCardano, CTL** — alternative off-chain libs. Committed to Lucid
  Evolution (ADR-001).
- **Weld / Cardano Connect with Wallet / Sorbet / Cardano Dev Wallet** — browser wallet-connect / mock
  wallets. We use a **server-side seed wallet** (no CIP-30), so not needed. (Sorbet/Dev-Wallet would only
  matter if we later add a browser-wallet demo.)
- **cardano-db-sync / cardano-graphql / Dolos / Yaci Store / Dingo** — heavyweight indexers/nodes. Blockfrost
  + Yaci DevKit cover all our data needs.
- **Mithril, Guild Operators, Cardano Signer, ZhuLi, StakePool scripts, Cardano Node Audit** — stake-pool
  ops & governance. Irrelevant to this project.
- **NFTCDN, Cardanopress, ODATANO, cardano-rosetta-java, IntelliADA, CardanoKit, hydra-sdk** — niche
  integrations (NFT media, WordPress, SAP, Rosetta, IDE, iOS). Not our path.

---

## Decision table (need → primary → alternative → why)

| Need | Primary | Alternative | Rationale |
|---|---|---|---|
| On-chain language | Aiken | (none) | Chosen; best dev speed + ExUnit benchmarking. |
| Off-chain tx builder | `@lucid-evolution/lucid` | MeshJS | Low-level control for the batch redeemer; mature. |
| Dev network + fast loop | **Yaci DevKit** (local) | Preprod directly | Instant funding + sub-second blocks; iterate fast. |
| Final public settlement | **Preprod** + Blockfrost | Yaci (local only) | Public Cardanoscan link is the judge-facing proof. |
| Congestion block reads | Blockfrost | **Koios** (keyless) / Yaci | Koios avoids burning Blockfrost rate limit under load. |
| Tx submission | Blockfrost | Koios `submittx` | Redundancy if Blockfrost throttles. |
| Mempool conflict detection (stretch) | — | **Maestro** | Only provider here with real mempool monitoring. |
| Explorer / proof | Cardanoscan (Preprod) | Yaci explorer (local) | On-screen verification. |
| Debugging | Lace Anatomy · Datum Explorer · Gastronomy | cardano-cli | Address/CBOR/datum/UPLC inspection. |

---

## How this maps to our config (no code change needed to switch providers)

`off-chain/src/config.ts` reads the API base URL and key from env, so switching Blockfrost ↔ Yaci ↔ Koios
is a `.env` change, not a code change:

```bash
# Blockfrost Preprod (public testnet — for the final settlement)
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0
BLOCKFROST_PROJECT_ID=preprod...

# Yaci DevKit local devnet (fast iteration — Blockfrost-compatible API)
# BLOCKFROST_URL=http://localhost:8080/api/v1/   # (use the port Yaci prints)
# BLOCKFROST_PROJECT_ID=                          # Yaci needs no key

# Koios Preprod (keyless backup for reads/submit — different request shapes)
# KOIOS_URL=https://preprod.koios.rest/api/v0
```
Keep Blockfrost as the default; flip to Yaci for development speed; keep Koios noted as the keyless
fallback. See [`build-plan.md`](./build-plan.md) Phase 0 for the two setup paths.
