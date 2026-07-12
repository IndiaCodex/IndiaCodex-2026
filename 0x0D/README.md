# Hydra Minecraft — Team 0x0D

**IndiaCodex 2026 submission**

> A fully playable Minecraft-style voxel game in the browser where **every block
> you place or break becomes a real Cardano transaction on a Hydra L2 head** —
> invisibly, with no wallet, no popups, and no fees.

---

## 🎬 Demo video

https://github.com/nickthelegend/IndiaCodex-2026/raw/main/0x0D/demo.mp4

<video src="https://github.com/nickthelegend/IndiaCodex-2026/raw/main/0x0D/demo.mp4" controls width="100%"></video>

▶ **[Watch / download the demo](./demo.mp4)** &nbsp;·&nbsp; 📊 **[Pitch deck (PPTX)](./0x0D-hydra-minecraft-pitch.pptx)**

*(If the player doesn't load inline, use the download link — GitHub occasionally
blocks inline playback of committed media.)*

---

## The idea

The terrain is a pure function of one fixed seed, so the world itself never
needs storing — only the **edits** do. Every place/break is a tiny event
(`x, y, z, blockType, action, seq`) small enough to be a transaction datum, and
the **Hydra head's UTxO set becomes the world's save file**. Replay the datums
in order and you rebuild the exact world on any client.

No wallet. No popups. No fees. No delays. The player just plays — the chain
records everything underneath.

## How it works

```
Browser (Three.js game) ──ws──► Relay (Node.js, signs txs) ──ws──► hydra-node (offline head)
        ▲                            │  NewTx (CBOR inline datum)         │
        └──── world deltas ──────────┴──── SnapshotConfirmed / /snapshot/utxo ┘
```

1. **Browser** applies your block edit instantly, then fire-and-forgets it to the relay.
2. **Relay** holds a server-side Ed25519 key (players never see it), builds a
   zero-fee Conway-era transaction with the block action as an **inline datum**,
   and submits it to the Hydra head via `NewTx`.
3. **Hydra head** (offline mode, zero-fee protocol params) accumulates the
   records. On `SnapshotConfirmed` the relay broadcasts world deltas to every
   client. New players rebuild the world from `GET /snapshot/utxo`.
4. If Hydra is unreachable the game keeps running; queued edits land on-chain
   when it returns.

Full write-up: **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** ·
full game docs & controls: **[GAME.md](./GAME.md)** ·
one-prompt build story: **[PROMPT.md](./PROMPT.md)** ·
verification log: **[EVALUATION.md](./EVALUATION.md)**.

## It's a real game

Chunked Perlin terrain (grass/dirt/stone/sand/water, trees, **caves & ore veins**),
first-person controls with gravity/jump/swim/fly, **survival mode** (hearts, fall
& drowning damage, death + respawn, item drops), **TNT** with fuses and chain
reactions, **falling sand**, **mobs** (zombies at night, sheep/pigs/cows/chickens),
real per-block mining times, a **minimap**, **multiplayer** avatars + chat, a
day/night cycle, and an in-game **Hydra debug overlay** (press `H`) showing head
status, snapshots, UTxO count, fuel, and a live on-chain transaction feed.

## The smart contract (on-chain)

The on-chain layer is the **block-action record** — an Aiken (Plutus V3)
formalisation of the datum every edit is written as, plus an append-only ledger
validator. See **[contracts/](./contracts/)**:

```
BlockAction = Constr 0 [ x, y, z : Int, block_type_id : Int, action : Int, seq : Int ]
```

- `contracts/lib/hydra_minecraft/types.ak` — the datum + well-formedness guard
- `contracts/validators/block_ledger.ak` — only the head authority may spend a
  record, and only a well-formed one (history is append-only)
- `aiken check` → **3 passed / 0 failed** · compiled hash `6c433965…`

**Proof it's real, not mocked:** a 2-TNT chain reaction produced **37 valid L2
transactions, 0 invalid** in one blast. `GET /chain` lists every action with its
real L2 tx hash and raw datum CBOR.

## Run it

```bash
npm install
npm run setup      # generate dev keys + genesis UTxO for the offline head
npm run hydra:up   # docker compose: hydra-node in offline mode
npm start          # relay + game — open the printed localhost URL, press H

cd contracts && aiken build && aiken check   # the smart contract
```

## Stack

- **Front-end:** vanilla JS + Three.js r158 (CDN), InstancedMesh voxels, no bundler
- **Back-end:** Node.js relay — Express + `ws` + `@emurgo/cardano-serialization-lib`
- **On-chain:** `hydra-node` (Docker, offline head, zero-fee) · Aiken / Plutus V3 · CBOR inline datums

## Folder map

```
0x0D/
├── README.md            ← you are here (+ demo video, pitch deck)
├── demo.mp4             ← launch/demo video
├── 0x0D-hydra-minecraft-pitch.pptx
├── client/             ← front-end (Three.js game)
├── server/             ← back-end (Hydra relay, tx signing, /chain)
├── contracts/          ← smart contract (Aiken / Plutus V3)  ← separate file, as required
├── docker/             ← hydra-node offline-mode compose
├── docs/ARCHITECTURE.md
├── GAME.md · PROMPT.md · EVALUATION.md
├── protocol-parameters.json  (zero-fee)
└── package.json
```

---

**Team 0x0D** · Cardano · Hydra L2 · IndiaCodex 2026
Project repo: https://github.com/nickthelegend/hydra-minecraft
