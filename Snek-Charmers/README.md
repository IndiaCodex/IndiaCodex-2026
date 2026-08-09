# Meme Launchpad (Cardano)

Launch a native token and trade it on a **linear bonding curve** (`price = m · supply + c`)
on the Cardano **Preprod** testnet. Buying moves price up, selling moves it down.

This is Milestone 1 — see [`docs/plans/2026-07-12-launchpad-m1-launch-and-bonding-curve.md`](docs/plans/2026-07-12-launchpad-m1-launch-and-bonding-curve.md)
for the full scope, decisions, and task breakdown.

## Repository layout

```
contracts/   Aiken on-chain code (minting policy + bonding-curve validator) -> plutus.json
apps/web/    Next.js 14 + Mesh SDK web app (wallet connect, launch form, trade panel)
docs/plans/  Implementation plans
```

## Prerequisites

- **Node.js 22+** and npm.
- **Aiken** (on-chain toolchain), installed via `aikup`:
  ```bash
  npm install -g @aiken-lang/aikup
  aikup                      # installs the latest Aiken (v1.1.x)
  ```
  Aiken installs to `~/.aiken/bin`. Add it to your `PATH` (e.g. in `~/.zshrc`):
  ```bash
  export PATH="$HOME/.aiken/bin:$PATH"
  ```
  Verify: `aiken -V`.
- A **Preprod-capable browser wallet** — [Eternl](https://eternl.io) or [Lace](https://www.lace.io), switched to the Preprod network.
- A free **Blockfrost** project key for Preprod: https://blockfrost.io
- Test ADA from the **Preprod faucet**: https://docs.cardano.org/cardano-testnets/tools/faucet

## Setup

### 1. On-chain (Aiken)

```bash
cd contracts
aiken check      # type-check + run tests
aiken build      # produces contracts/plutus.json (CIP-57 blueprint)
```

### 2. Web app (Next.js + Mesh)

```bash
cd apps/web
cp .env.example .env.local     # then fill in your Blockfrost Preprod key
npm install
npm run dev                    # http://localhost:3000
```

Connect a Preprod wallet on the home page to confirm the toolchain works.

## Stack notes

- **On-chain:** Aiken → CIP-57 blueprint (`plutus.json`), consumed off-chain.
- **Off-chain / UI:** Next.js 14 + React 18 + **Mesh SDK pinned to `@meshsdk/core`/`@meshsdk/react` `1.8.14`** (an aligned stable pair — do not mix with the `2.0.0-beta` react line, which targets an unreleased `core` 2.x).
- **Provider / network:** Blockfrost, Preprod (network id `0`).
- Mesh needs two `next.config.mjs` tweaks (already applied): WASM webpack experiments, and a `libsodium-wrappers-sumo` → CommonJS alias (its ESM build is broken). All Mesh UI is loaded client-only (`next/dynamic` `ssr:false`) because its WASM cannot run during server prerender.

## Status

Milestone 1 scaffold is in place (Aiken project compiles; web app builds and serves with wallet connect). The minting policy, bonding-curve validator, and launch/trade flows are built in the subsequent steps of the plan.
