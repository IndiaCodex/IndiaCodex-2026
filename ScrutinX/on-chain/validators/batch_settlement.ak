//// Batch settlement validator (claim pattern).
////
//// Authorizes ONE settlement transaction that claims a whole batch of ticket UTXOs.
//// The spend handler fires once PER script input in the batch, so every check is written to
//// reach the same verdict regardless of which input triggered this evaluation (order-independent).
////
//// Rules (trimmed to 4 for the hackathon — see Docs/onchain-spec.md §4 for the full 6):
////   1. this input's datum is Open
////   2. each claimant signed the tx
////   3. no UTXO appears twice in the batch (no double-claim)
////   4. state stays split: continuing script outputs >= number of claims (Docs rule 6)
////
//// ⚠️ Verify constructor/module names against your pinned Aiken stdlib version.

use aiken/collection/list
use cardano/address.{Address, from_script}
use cardano/assets.{from_lovelace}
use cardano/transaction.{
  Input, InlineDatum, Output, OutputReference, Transaction, placeholder,
}
use batcher/types.{BatchDatum, BatchRedeemer, ClaimEntry, Claimed, Open, Status}

validator batch_settlement {
  spend(
    datum: Option<BatchDatum>,
    redeemer: BatchRedeemer,
    own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(d) = datum
    and {
      // this specific input is Open
      d.status == Open,
      // this input's ref is in the batch exactly once
      claimed_once(redeemer.claims, own_ref),
      // the whole tx is well-formed (checked identically for every input)
      validate_batch(redeemer, self, own_ref),
    }
  }

  else(_) {
    fail
  }
}

/// Rule 3 (per-input view): `ref` appears exactly once across all claims.
fn claimed_once(claims: List<ClaimEntry>, ref: OutputReference) -> Bool {
  list.count(claims, fn(c) { c.utxo_ref == ref }) == 1
}

/// Whole-transaction validation. Written to be input-order-independent.
fn validate_batch(
  redeemer: BatchRedeemer,
  self: Transaction,
  own_ref: OutputReference,
) -> Bool {
  let claims = redeemer.claims
  and {
    no_duplicate_refs(claims),
    list.all(claims, fn(c) { input_is_open(self, c.utxo_ref) }),
    list.all(claims, fn(c) { list.has(self.extra_signatories, c.claimant) }),
    state_stays_split(self, own_ref, list.length(claims)),
  }
}

/// Rule 3 (global): every claim's utxo_ref is unique.
fn no_duplicate_refs(claims: List<ClaimEntry>) -> Bool {
  list.all(
    claims,
    fn(c) { list.count(claims, fn(x) { x.utxo_ref == c.utxo_ref }) == 1 },
  )
}

/// Rules 1 (global): the input referenced by `ref` exists and its datum is Open.
fn input_is_open(self: Transaction, ref: OutputReference) -> Bool {
  when list.find(self.inputs, fn(i) { i.output_reference == ref }) is {
    Some(input) ->
      when input.output.datum is {
        InlineDatum(data) -> {
          expect d: BatchDatum = data
          d.status == Open
        }
        _ -> False
      }
    None -> False
  }
}

/// Rule 4 (the concurrency invariant): continuing script outputs >= number of claims.
/// State must NOT be collapsed into one output, or the next batch collides on it.
fn state_stays_split(
  self: Transaction,
  own_ref: OutputReference,
  claim_count: Int,
) -> Bool {
  expect Some(own_input) =
    list.find(self.inputs, fn(i) { i.output_reference == own_ref })
  let script_address = own_input.output.address
  let continuing =
    list.count(self.outputs, fn(o) { o.address == script_address })
  continuing >= claim_count
}

// ===========================================================================
// Tests — run with `aiken check`.
// ===========================================================================

// ---- pure-helper tests (no Transaction mock) ----

test claimed_once_true() {
  let ref = OutputReference { transaction_id: #"aa", output_index: 0 }
  let claims = [ClaimEntry { utxo_ref: ref, claimant: #"01" }]
  claimed_once(claims, ref)
}

test claimed_once_false_when_absent() {
  let ref = OutputReference { transaction_id: #"aa", output_index: 0 }
  let other = OutputReference { transaction_id: #"bb", output_index: 0 }
  let claims = [ClaimEntry { utxo_ref: other, claimant: #"01" }]
  !claimed_once(claims, ref)
}

test no_duplicate_refs_ok() {
  let r0 = OutputReference { transaction_id: #"aa", output_index: 0 }
  let r1 = OutputReference { transaction_id: #"aa", output_index: 1 }
  no_duplicate_refs(
    [
      ClaimEntry { utxo_ref: r0, claimant: #"01" },
      ClaimEntry { utxo_ref: r1, claimant: #"02" },
    ],
  )
}

test no_duplicate_refs_rejects_dup() {
  let r0 = OutputReference { transaction_id: #"aa", output_index: 0 }
  !no_duplicate_refs(
    [
      ClaimEntry { utxo_ref: r0, claimant: #"01" },
      ClaimEntry { utxo_ref: r0, claimant: #"02" },
    ],
  )
}

// ---------------------------------------------------------------------------
// Full-transaction tests — build mocked Transactions from stdlib primitives and
// exercise the whole spend() handler (accept + every reject case). AGENT.md §6.
// ---------------------------------------------------------------------------

const claimer: ByteArray = #"01"

// 28-byte script hash / 32-byte tx id constants for the mocks.
fn addr() -> Address {
  from_script(#"00000000000000000000000000000000000000000000000000000000")
}

fn ref_at(idx: Int) -> OutputReference {
  OutputReference {
    transaction_id: #"0000000000000000000000000000000000000000000000000000000000000000",
    output_index: idx,
  }
}

fn mk_input(idx: Int, status: Status) -> Input {
  Input {
    output_reference: ref_at(idx),
    output: Output {
      address: addr(),
      value: from_lovelace(2_000_000),
      datum: InlineDatum(BatchDatum { owner: claimer, item_id: #"74", status }),
      reference_script: None,
    },
  }
}

fn mk_output() -> Output {
  Output {
    address: addr(),
    value: from_lovelace(2_000_000),
    datum: InlineDatum(
      BatchDatum { owner: claimer, item_id: #"74", status: Claimed },
    ),
    reference_script: None,
  }
}

fn mk_claim(idx: Int) -> ClaimEntry {
  ClaimEntry { utxo_ref: ref_at(idx), claimant: claimer }
}

fn open_datum() -> BatchDatum {
  BatchDatum { owner: claimer, item_id: #"74", status: Open }
}

/// Build a fully-valid batch of size `n` (all Open inputs, n Claimed outputs, all
/// signed) and run the spend handler for the first input.
fn run_valid_batch(n: Int) -> Bool {
  let idxs = list.range(0, n - 1)
  let tx =
    Transaction {
      ..placeholder,
      inputs: list.map(idxs, fn(i) { mk_input(i, Open) }),
      outputs: list.map(idxs, fn(_i) { mk_output() }),
      extra_signatories: [claimer],
    }
  batch_settlement.spend(
    Some(open_datum()),
    BatchRedeemer { claims: list.map(idxs, mk_claim) },
    ref_at(0),
    tx,
  )
}

test accept_valid_batch_of_3() {
  run_valid_batch(3)
}

// rule 1 — an input still marked Claimed must be rejected
test reject_when_an_input_is_claimed() {
  let tx =
    Transaction {
      ..placeholder,
      inputs: [mk_input(0, Open), mk_input(1, Claimed)],
      outputs: [mk_output(), mk_output()],
      extra_signatories: [claimer],
    }
  !batch_settlement.spend(
    Some(open_datum()),
    BatchRedeemer { claims: [mk_claim(0), mk_claim(1)] },
    ref_at(0),
    tx,
  )
}

// rule 2 — a claimant that didn't sign must be rejected
test reject_missing_signature() {
  let tx =
    Transaction {
      ..placeholder,
      inputs: [mk_input(0, Open), mk_input(1, Open)],
      outputs: [mk_output(), mk_output()],
      extra_signatories: [],
    }
  !batch_settlement.spend(
    Some(open_datum()),
    BatchRedeemer { claims: [mk_claim(0), mk_claim(1)] },
    ref_at(0),
    tx,
  )
}

// rule 3 — the same utxo_ref claimed twice must be rejected
test reject_duplicate_utxo_ref() {
  let tx =
    Transaction {
      ..placeholder,
      inputs: [mk_input(0, Open), mk_input(1, Open)],
      outputs: [mk_output(), mk_output(), mk_output()],
      extra_signatories: [claimer],
    }
  !batch_settlement.spend(
    Some(open_datum()),
    BatchRedeemer { claims: [mk_claim(0), mk_claim(1), mk_claim(1)] },
    ref_at(0),
    tx,
  )
}

// rule 4 — collapsing state into fewer outputs than claims must be rejected
test reject_collapsed_outputs() {
  let tx =
    Transaction {
      ..placeholder,
      inputs: [mk_input(0, Open), mk_input(1, Open)],
      outputs: [mk_output()],
      extra_signatories: [claimer],
    }
  !batch_settlement.spend(
    Some(open_datum()),
    BatchRedeemer { claims: [mk_claim(0), mk_claim(1)] },
    ref_at(0),
    tx,
  )
}

// ---- batch-size benchmark: `aiken check` reports CPU/mem per test. The largest
// n whose cost stays under maxTxExUnits is N_max → set demo-app config.batchCap.
test benchmark_batch_4() {
  run_valid_batch(4)
}

test benchmark_batch_8() {
  run_valid_batch(8)
}

test benchmark_batch_16() {
  run_valid_batch(16)
}

test benchmark_batch_24() {
  run_valid_batch(24)
}
