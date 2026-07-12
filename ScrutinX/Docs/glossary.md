# Glossary

Every term this project uses, defined plainly. If a doc uses a word you don't know, it's here.
Ordered roughly from "most fundamental" to "most specific."

---

### UTXO (Unspent Transaction Output)
A discrete chunk of value on Cardano — think of it as **a specific coin or banknote with a serial
number**, not a balance. Your wallet's "balance" is really a pile of separate UTXOs. When you spend,
you consume whole UTXOs as *inputs* and create new ones as *outputs* (including your change). A UTXO
can also carry **data** (a datum) and be **locked by a script**, which is how smart contracts hold state.

### eUTXO (Extended UTXO)
Cardano's accounting model. "Extended" = UTXOs can carry arbitrary data (**datum**) and be guarded by
on-chain code (**validators**). Contrast with the **account model** (Ethereum, Solana) where state is a
mutable balance in a shared account. The defining consequence of eUTXO for this project:

### UTXO contention (the core problem)
Because **a UTXO can be spent by only one transaction at a time**, when many transactions all try to
spend the *same* UTXO, only one succeeds; the rest **fail on-chain**. If a contract keeps its state in
a single shared UTXO, concurrent users collide and most of them fail. This is the single most-cited
limitation of building on Cardano, and the reason this project exists.

### Datum
Data attached to a UTXO that lives on-chain. For a script UTXO, the datum is the contract's state for
that UTXO (e.g. "this ticket is Open and owned by nobody yet"). A validator reads the datum when the
UTXO is being spent.

### Redeemer
Data supplied by the spender **at spend time** to say *how* they intend to spend a script UTXO / *what
action* they're taking. Our batch redeemer carries the whole list of claims being settled together.

### Validator (script)
On-chain code that runs when someone tries to spend a UTXO locked by it (or mint under a policy). It
returns pass/fail — it **cannot change state**, only approve or reject a transaction that others
construct. Ours is written in **Aiken**.

### Aiken
A modern smart-contract language for Cardano with Rust/Elm-like syntax that compiles to **UPLC**
(Untyped Plutus Core, the on-chain VM bytecode). Chosen over Plutus/Haskell for developer speed.
`aiken build` produces a `plutus.json` blueprint; `aiken check` runs tests **on the real on-chain VM**
and reports CPU/memory cost.

### UPLC (Untyped Plutus Core)
The low-level bytecode that actually runs on Cardano's on-chain virtual machine. You don't write it by
hand; Aiken compiles to it. Relevant because on-chain execution is metered (see **execution units**).

### plutus.json (CIP-0057 blueprint)
The JSON file `aiken build` emits. It contains the compiled validator (CBOR-encoded), its **hash**
(which becomes the script address), and the schema of the datum/redeemer. Off-chain code
(Lucid/MeshJS) reads this file to build transactions that talk to the contract.

### Script address
An address derived from a validator's hash. Sending funds to it "locks" them under the validator.
There is **no separate deploy step** on Cardano — the first transaction that sends funds to the script
address is effectively the deployment.

### Reference script
An optimization: publish the compiled validator once, inside a single dedicated UTXO. Later
transactions **point to** that UTXO instead of re-embedding the full script bytecode, which meaningfully
lowers per-transaction fees. Standard practice for any real protocol; optional for the hackathon MVP.

### Execution units (ExUnits: CPU steps + memory)
Cardano meters on-chain script execution in two budgets — **CPU steps** and **memory**. Every
transaction has a **maximum** it may consume (`maxTxExUnits`). This is the hard ceiling on **how large a
batch can be**: a bigger batch means more validator work, and if it exceeds `maxTxExUnits` the tx is
invalid. `aiken check` reports these costs, doubling as our batch-size benchmark.

### Collateral
A UTXO the wallet earmarks to cover fees **if a script transaction fails phase-2 validation**. Any
transaction that runs a script requires collateral to be set. CIP-30 wallets (Eternl, Lace) let the user
configure it. A common demo footgun: forgetting to set collateral → contract calls silently fail.

### CIP-30
The Cardano standard for **wallet ↔ dApp** communication in the browser (connect, get UTXOs, sign,
submit). Because Eternl, Lace, and others all implement CIP-30, Lucid/MeshJS auto-detect any of them —
**we never write wallet-specific code.**

### CIP-0057
The standard that defines the `plutus.json` blueprint format (see above).

### Blockfrost
A hosted API that gives us read/write access to the Cardano chain without running our own node: query
UTXOs, read block/epoch data (for the congestion score), fetch protocol parameters (for fee math), and
**submit** transactions. Free tier, one project per network (we use a **Preprod** project).
Caveat: its **mempool endpoint only shows transactions submitted through Blockfrost** and the mempool
isn't global — which is why real-mempool conflict detection is a stretch goal, not MVP.

### Preprod (testnet)
A Cardano test network that mirrors mainnet behavior but uses **valueless test ADA** from a free
**faucet**. All hackathon work happens here — no real funds at risk.

### Lucid Evolution / MeshJS
TypeScript libraries that build, sign, and submit Cardano transactions from off-chain code. **MeshJS**
ships more turnkey React components; **Lucid Evolution** is slightly lower-level and more explicit. Pick
one and commit — mixing them causes pain (see `decisions.md`, ADR-001). We use **Lucid Evolution** =
the npm package **`@lucid-evolution/lucid`** (Anastasia Labs).

### Evolution SDK (≠ Lucid Evolution)
A *newer, different* off-chain library — npm **`@evolution-sdk/evolution`** (IntersectMBO), pure-TypeScript
built on Effect, with a "Migration from Lucid" guide. Featured on developers.cardano.org. **Do not confuse
it with Lucid Evolution (`@lucid-evolution/lucid`).** We stay on Lucid Evolution for the hackathon; Evolution
SDK is a post-hackathon evaluation (see `cardano-tools.md`).

### Yaci DevKit
A tool that spins up a **local Cardano devnet** in seconds (Docker/ZIP/NPM) with a built-in indexer,
explorer, and a **Blockfrost-compatible API**. Supports a **built-in faucet** (`topup addr 50000`) and
**configurable/sub-second block times**. We use it to iterate fast without the Preprod faucet wait; the
final public settlement still goes to Preprod (see `decisions.md`, ADR-007).

### Koios
A free, community-run, **keyless** REST/GraphQL query layer for Cardano (public tier ~5,000 req/day).
Preprod base URL `https://preprod.koios.rest/api/v0`. Our keyless backup for congestion block-reads and tx
submission when Blockfrost's rate limit bites (see `decisions.md`, ADR-008).

### Maestro
A hosted Cardano API (free tier, API key, Preprod) that — unlike Blockfrost's free tier — offers real
**mempool monitoring** of pending transactions. The concrete enabler of the *real mempool conflict
detection* stretch goal; not built in the 6h MVP.

### Cardanoscan
A Cardano block explorer. We use the Preprod instance —
`https://preprod.cardanoscan.io/transaction/<txHash>` — to show a **verifiable settlement link** on screen
during the demo.

---

## This project's own vocabulary

### Batcher
An off-chain service that collects users' *requests* (instead of their raw transactions), figures out
which are compatible, and bundles the compatible ones into a **single settlement transaction**. The
category this whole project belongs to.

### Settlement transaction
The one on-chain transaction that finalizes a whole batch of approved requests at once, validated by
`batch_settlement.ak`.

### Contention graph
A graph where **each node is a pending request** and **an edge connects two requests that would spend
the same UTXO / touch the same state** (i.e. they conflict). Produced by the **Conflict Detector**.
"Graph" here just means dots-and-lines — no deeper math implied by the word itself.

### Maximum Independent Set (MIS)
A classic graph problem: find the **largest set of nodes with no edges between any of them**. In our
graph that's the **largest group of pending requests where nobody conflicts with anybody** — exactly
the biggest batch we can safely settle at once. NP-hard in general, but our graphs are small and sparse,
so a greedy heuristic (or a small exact solver) is plenty. The **Batch Optimizer** solves this.

### Congestion score
A number in **`[0, 1]`** summarizing how busy the network is right now. Near 0 = quiet, near 1 = jammed.
Produced by the **Congestion Predictor**. Drives batch **timing and size**: high score → wait longer,
batch bigger; low score → clear fast for low latency.

### EWMA (Exponentially Weighted Moving Average)
A running average that weights **recent** samples more heavily than older ones, controlled by a smoothing
factor α. `score_t = α·sample_t + (1−α)·score_{t−1}`. Our MVP congestion score is an EWMA of recent
block fullness. Cheap, no training, reacts quickly to change — deliberately **not** a trained ML model.

### Block fullness
How full a block is relative to the maximum block size (`maxBlockBodySize`), i.e.
`block_bytes / max_block_bytes ∈ [0,1]`. The primary input to the congestion score, read from Blockfrost.

### Naive path vs Batcher path
The two sides of the demo. **Naive path** = each request submitted as its own transaction → many fail or
queue on UTXO contention. **Batcher path** = the same requests flow through Conflict Detector →
Congestion Predictor → Batch Optimizer → one settlement tx. The demo shows both side by side.

### Leios (context, not a dependency)
An in-progress **base-layer** scaling upgrade for Cardano. Named here only to draw the boundary: this
project improves **effective** throughput at the application/infrastructure layer; Leios improves
**base-layer** throughput. They're complementary, not competitors. (See `pitch-and-risks.md`.)
