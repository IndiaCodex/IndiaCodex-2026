# On-chain spec — `batch_settlement.ak`

The Aiken validator that authorizes a whole batch of user requests in **one spend**.

> **Correction to the brief:** `Projectidea.md` §5 shows a validator signature using `ScriptContext`.
> Aiken's validator API has since moved to **named `validator` blocks with typed handlers** where the
> spend handler receives `(datum: Option<D>, redeemer: R, own_ref: OutputReference, self: Transaction)`.
> This doc uses the current syntax. Verify against the Aiken version pinned in `aiken.toml` at build time.

---

## 1. Purpose

Validate that a settlement transaction correctly processes a batch of user-approved requests (ticket
claims for the MVP) in a single spend, while **splitting state across multiple output UTXOs** so the
next batch can also run concurrently (the eUTXO best practice — never collapse state into one output).

The validator is **all-or-nothing**: either the entire batch is valid and the transaction succeeds, or
the whole transaction fails. The off-chain Optimizer is responsible for only ever proposing batches that
pass (see [`architecture.md`](./architecture.md) §5).

---

## 2. Types (datum, redeemer)

```aiken
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference}

pub type Status {
  Open
  Claimed
}

/// Datum attached to each ticket UTXO sitting at the script address.
pub type BatchDatum {
  owner: VerificationKeyHash,   // who is allowed to claim/trade this UTXO's contents
  item_id: ByteArray,           // ticket ID / order ID
  status: Status,               // Open | Claimed
}

/// One entry in the batch: "this input UTXO is being claimed by this key."
pub type ClaimEntry {
  utxo_ref: OutputReference,
  claimant: VerificationKeyHash,
}

/// The redeemer carries the entire batch being settled in this transaction.
pub type BatchRedeemer {
  claims: List<ClaimEntry>,
}
```

> Types live in `on-chain/lib/types.ak`; the validator imports them. Keep them minimal — every field
> costs bytes on-chain and execution units to inspect.

---

## 3. Validator skeleton (current Aiken syntax)

```aiken
use aiken/collection/list
use cardano/transaction.{Transaction, OutputReference, Output, Input}
use batcher/types.{BatchDatum, BatchRedeemer, ClaimEntry, Open, Claimed}

validator batch_settlement {
  spend(
    datum: Option<BatchDatum>,
    redeemer: BatchRedeemer,
    own_ref: OutputReference,
    self: Transaction,
  ) {
    // The spend handler runs ONCE PER INPUT being unlocked. Because a batch settles many
    // script inputs in one tx, this handler executes once for each of them. Each execution
    // must independently agree the whole transaction is well-formed. Design the checks so
    // they are consistent no matter which input triggered this particular evaluation.
    expect Some(d) = datum

    and {
      // (1) this specific UTXO is Open
      d.status == Open,
      // (2) this UTXO's ref appears in the redeemer's claim list exactly once
      claimed_once(redeemer.claims, own_ref),
      // (3) the whole batch is globally well-formed (checked identically per input)
      validate_batch(redeemer, self),
    }
  }

  else(_) {
    fail
  }
}
```

The per-input model is the single most important subtlety: **the spend handler fires separately for
each script input in the batch.** Global checks (no duplicate UTXOs, all claimants signed, state stays
split) must be written so that every per-input evaluation reaches the same verdict on the whole
transaction. Do not write a check that only makes sense "for the first input."

---

## 4. Required checks (the full list)

Numbered to match `Projectidea.md` §5, expanded with the how and the edge cases.

| # | Rule | How to check | Edge case to test |
|---|---|---|---|
| 1 | Every `ClaimEntry` corresponds to a real input UTXO in this tx | For each claim, find an input in `self.inputs` whose `output_reference == claim.utxo_ref` | A claim referencing a UTXO not present as an input → reject |
| 2 | Each claimed UTXO's datum has `status == Open` | Read each referenced input's datum, assert `Open` | An already-`Claimed` UTXO smuggled in → reject |
| 3 | The tx authorizes each `claimant` | Assert each `claim.claimant` ∈ `self.extra_signatories` (or a delegated-auth scheme) | A claim on behalf of someone who didn't sign → reject |
| 4 | No UTXO appears twice in the batch | Assert `claims` has no duplicate `utxo_ref` | Same `utxo_ref` twice (double-claim) → reject |
| 5 | Outputs correctly mark claimed items | For each claim, assert a corresponding output exists with `status == Claimed` and `owner == claimant` (claim pattern) | Missing/incorrect output datum → reject |
| 6 | **State stays split across outputs** | Assert the number of continuing script outputs ≥ number of claims (one output per claimed ticket; no collapsing) | All tickets merged into one output → reject |

### Notes per rule

- **Rule 3 (authorization).** MVP uses `extra_signatories` (the tx is signed by each claimant). In the
  demo, a single load-gen wallet may stand in for many "users," in which case one signature authorizes
  many claims — acceptable for the demo, but call it out honestly. A production scheme would use
  per-user delegated authorization; that's a stated next step.
- **Rule 5 (claim vs swap semantics).** Decide during scaffolding: *claim pattern* = output marks the
  ticket `Claimed` and assigns `owner = claimant`; *swap pattern* = outputs move value between parties.
  The MVP is the **claim pattern** (see `decisions.md`, ADR-002). Keep it that simple.
- **Rule 6 (the concurrency invariant).** This is the rule most demos get wrong and the one judges who
  know Cardano will look for. Enforce a lower bound on continuing script outputs so state cannot be
  concentrated. See [`architecture.md`](./architecture.md) §6.

---

## 5. Helper functions (sketch)

```aiken
/// Rule 4: the given ref appears exactly once across all claims.
fn claimed_once(claims: List<ClaimEntry>, ref: OutputReference) -> Bool {
  list.count(claims, fn(c) { c.utxo_ref == ref }) == 1
}

/// Rules 1–6 evaluated over the whole transaction. Written to be input-order-independent.
fn validate_batch(redeemer: BatchRedeemer, self: Transaction) -> Bool {
  let claims = redeemer.claims
  and {
    no_duplicate_refs(claims),                          // rule 4 (global)
    list.all(claims, fn(c) { input_is_open(self, c) }), // rules 1 + 2
    list.all(claims, fn(c) { signed_by(self, c.claimant) }), // rule 3
    list.all(claims, fn(c) { has_claimed_output(self, c) }), // rule 5
    state_stays_split(self, list.length(claims)),       // rule 6
  }
}
```

Implement `no_duplicate_refs`, `input_is_open`, `signed_by`, `has_claimed_output`, `state_stays_split`
as small pure functions in the validator file, each with its own `test`.

---

## 6. Testing & the execution-unit budget

Run **`aiken check`** continuously. Beyond correctness, it reports **CPU steps and memory** per test —
and that is our **batch-size benchmark**:

1. Write a parameterized test that builds a batch of size `k` and settles it.
2. Run `aiken check` for `k = 1, 2, 4, 8, 16, 24, 32, …`.
3. Record steps + memory for each `k`. Both grow with `k` (roughly linearly, plus per-tx overhead).
4. The largest `k` whose cost stays under `maxTxExUnits` (a protocol parameter — fetch the live value
   from Blockfrost, don't hardcode) is the **calibrated max batch size**.
5. Feed that number to the off-chain Optimizer as its hard cap (see `architecture.md` §5, `offchain-spec.md`).

> **This benchmark is a demo asset.** "We measured that a single settlement can safely batch up to N
> claims before hitting the on-chain execution limit" is a concrete, credible number. Put it on a slide.

### Measured results (Aiken v1.1.23, stdlib v3.1.0 — `run_valid_batch(n)` incl. mock-build overhead)

| n (claims) | memory | % of tx mem limit (14M) | cpu steps | % of tx cpu limit (10B) |
|---|---|---|---|---|
| 4 | 565,654 | 4.0% | 225,218,304 | 2.3% |
| 8 | 1,297,966 | 9.3% | 568,117,306 | 5.7% |
| 16 | 3,462,142 | 24.7% | 1,669,782,078 | 16.7% |
| 24 | 6,559,054 | **46.9%** | 3,325,935,874 | 33.3% |

> ⚠️ **The single-spend benchmark above UNDER-counts the real on-chain cost.** `aiken check` calls the spend
> handler **once**. On-chain, the validator runs **once per script input** — so a batch of `n` inputs runs
> the handler `n` times, and each run does the O(n²) `list.find`/`list.count` work → the true cost is
> **~O(n³)**, memory-bound.

**Measured ON-CHAIN (real Preprod txs, not the synthetic benchmark):**
- 5 claims in one tx → **confirmed** (tx `9655d2c2…`), ~53% cheaper than 5 separate txs.
- 16 claims in one tx → **rejected**: "execution went over budget" at input ~7.
- ⟹ **Real `N_max` ≈ 6–7** with this validator. `config.batchCap = 6` (safe).

> **The headline optimization (say it in the pitch):** the real scaling limit is this validator's
> `list.find`/`list.count`-per-claim run once per input (~O(n³)) — **not eUTXO itself**. Replacing those
> with a **`Dict`-based O(1) membership check** drops it to ~O(n²) total and pushes `N_max` far higher. This
> is a concrete, measured, credible optimization — we found the limit by hitting it on-chain, not by guessing.

Write unit tests for every rule, including the **rejection** cases in §4's edge-case column — a validator
that only tests the happy path is a validator that will approve a malicious batch. **Done:** the validator
has 13 passing tests — 4 pure-helper, `accept_valid_batch_of_3`, 4 reject cases (claimed input, missing
signature, duplicate ref, collapsed outputs), and 4 benchmark sizes.

---

## 7. Build, address, deploy

```bash
aiken build        # produces plutus.json (CIP-0057 blueprint): compiled script + hash + schema
```

- The validator **hash** in `plutus.json` derives the **script address**. There is no separate deploy tx.
- **"Deployment"** = the first transaction that sends funds (the seed ticket UTXOs) to that address.
- Off-chain code (Lucid/MeshJS) reads `plutus.json` to build transactions — never re-type the script by hand.

### Reference script (optional optimization)
Publish the compiled validator once inside a dedicated UTXO; later settlement txs **reference** it instead
of re-embedding the bytecode, cutting per-tx fees. Implementing it strengthens the fee-savings demo but is
not required for a credible pitch (see `decisions.md`, ADR-004, and `fee-economics.md`).

---

## 8. Open on-chain decisions (resolve during scaffolding)

- **Claim vs swap pattern** → MVP = claim (ADR-002).
- **Authorization scheme** → MVP = `extra_signatories`; delegated per-user auth is a next step.
- **One datum per ticket vs grouped datums** → MVP = one UTXO per ticket (maximizes visible concurrency,
  simplest rule-6 check).
- **Exact `state_stays_split` bound** → start with "continuing script outputs ≥ claims"; tighten if the
  demo needs a stronger guarantee.
