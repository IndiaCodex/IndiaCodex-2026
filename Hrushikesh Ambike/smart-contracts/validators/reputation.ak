// Non-transferable on-chain reputation registry.
//
// Cardano has no native "soulbound" token mechanism -- native tokens are
// freely transferable, so a reputation *token* sitting in a wallet could
// just be sold, defeating the point. Instead, reputation lives as
// protocol-controlled state: a datum in a UTxO under this validator's own
// address, updatable only by the protocol's own rules.
//
// The core rule enforced here: a `ReputationDatum` UTxO can only be
// spent-and-recreated-with-updated-fields inside a transaction that ALSO
// contains a vault input being spent with redeemer `Repay(_)` or `Close`,
// for a vault whose `owner` matches this reputation UTxO's `owner`. That's
// the "validator-linked update" -- reputation can't be self-forged, only
// earned as a side effect of a real repayment happening in the same
// transaction.
//
// Downstream code (vault borrow) is expected to read the resulting
// reputation UTxO as a *reference input* (CIP-31/68 style) to raise LTV /
// unlock the credit line. That consumer is out of scope here -- this file
// only owns the registry validator and its update rules.

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/address.{Address, VerificationKey}
use cardano/assets
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Redeemer, ScriptPurpose, Spend,
  Transaction,
}
use ouro/ltv.{tier_of}
use ouro/types.{
  Borrow, Bronze, Close, Gold, Repay, Silver, Tier, VaultDatum, VaultRedeemer,
}

/// A vault redeemer classified into the two events that touch reputation.
/// `LinkedClose` deliberately carries no amount: by the time `Close` is
/// valid, principal_tusdm is already 0 (enforced by vault.ak's own
/// close_ok), so any debt reduction already happened via prior `Repay(n)`
/// events - Close itself only marks the loan cycle as fully done.
type LinkedEvent {
  LinkedRepay(Int)
  LinkedClose
}

/// Non-transferable reputation, keyed by owner. Lives as an inline datum on
/// a UTxO at this validator's own address; never moves except via a
/// validator-linked update (see module docs above).
pub type ReputationDatum {
  owner: VerificationKeyHash,
  cumulative_repaid: Int,
  loans_repaid: Int,
  first_seen: Int,
  tier: Tier,
}

/// Gates updates to a `ReputationDatum` UTxO: the update is only valid when
/// the transaction also spends a vault input (for the same `owner`) using
/// redeemer `Repay(_)` or `Close`.
validator reputation {
  spend(
    datum: Option<ReputationDatum>,
    _redeemer: Data,
    own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(d) = datum

    when linked_event(self, d.owner) is {
      None -> False
      Some(LinkedRepay(amount)) -> {
        let expected =
          ReputationDatum {
            ..d,
            cumulative_repaid: d.cumulative_repaid + amount,
            tier: tier_of(d.cumulative_repaid + amount, d.loans_repaid),
          }
        continuing_datum(self, own_ref) == expected
      }
      Some(LinkedClose) -> {
        let expected =
          ReputationDatum {
            ..d,
            loans_repaid: d.loans_repaid + 1,
            tier: tier_of(d.cumulative_repaid, d.loans_repaid + 1),
          }
        continuing_datum(self, own_ref) == expected
      }
    }
  }

  else(_) {
    fail
  }
}

fn own_address(self: Transaction, own_ref: OutputReference) -> Address {
  expect Some(own_input) =
    self.inputs |> list.find(fn(input) { input.output_reference == own_ref })
  own_input.output.address
}

fn continuing_datum(self: Transaction, own_ref: OutputReference) -> ReputationDatum {
  let own_addr = own_address(self, own_ref)
  expect Some(own_output) =
    self.outputs |> list.find(fn(output) { output.address == own_addr })
  expect InlineDatum(raw) = own_output.datum
  expect datum: ReputationDatum = raw
  datum
}

/// Scans the transaction's inputs + redeemers for a vault input owned by
/// `owner` that is being spent with `Repay(n)` or `Close`, classifying
/// which one it is (see `LinkedEvent`). `None` if no such input exists.
///
/// This inspects the transaction structurally against the already-existing
/// `VaultRedeemer` type -- it does not require `vault.ak` to exist, since
/// `VaultRedeemer` and `VaultDatum` are already defined in `ouro/types`.
fn linked_event(
  self: Transaction,
  owner: VerificationKeyHash,
) -> Option<LinkedEvent> {
  find_linked_vault_input(self.inputs, self.redeemers, owner)
}

fn find_linked_vault_input(
  inputs: List<Input>,
  redeemers: Pairs<ScriptPurpose, Redeemer>,
  owner: VerificationKeyHash,
) -> Option<LinkedEvent> {
  when inputs is {
    [] -> None
    [input, ..rest] -> {
      let purpose = Spend(input.output_reference)
      let found = list.find(redeemers, fn(pair) { pair.1st == purpose })
      when found is {
        Some(pair) -> {
          let event = classify_vault_redeemer(pair.2nd)
          when event is {
            Some(e) ->
              if vault_input_owned_by(input.output, owner) {
                Some(e)
              } else {
                find_linked_vault_input(rest, redeemers, owner)
              }
            None -> find_linked_vault_input(rest, redeemers, owner)
          }
        }
        None -> find_linked_vault_input(rest, redeemers, owner)
      }
    }
  }
}

/// Decodes a redeemer as a `VaultRedeemer`, classifying `Repay(n)` /
/// `Close` into a `LinkedEvent`. Any other redeemer shape (including one
/// that doesn't decode as a `VaultRedeemer` at all) yields `None`.
fn classify_vault_redeemer(redeemer: Redeemer) -> Option<LinkedEvent> {
  if redeemer is r: VaultRedeemer {
    when r is {
      Repay(amount) -> Some(LinkedRepay(amount))
      Close -> Some(LinkedClose)
      _ -> None
    }
  } else {
    None
  }
}

/// Checks that a spent vault input's inline `VaultDatum` belongs to `owner`.
fn vault_input_owned_by(output: Output, owner: VerificationKeyHash) -> Bool {
  when output.datum is {
    InlineDatum(data) ->
      if data is vault_datum: VaultDatum {
        vault_datum.owner == owner
      } else {
        False
      }
    _ -> False
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const test_owner: VerificationKeyHash =
  #"00000000000000000000000000000000000000000000000000000000"

const other_owner: VerificationKeyHash =
  #"11111111111111111111111111111111111111111111111111111111"

fn dummy_output_ref() -> OutputReference {
  OutputReference {
    transaction_id: #"0000000000000000000000000000000000000000000000000000000000000000",
    output_index: 0,
  }
}

fn vault_output(owner: VerificationKeyHash) -> Output {
  Output {
    address: Address {
      payment_credential: VerificationKey(owner),
      stake_credential: None,
    },
    value: assets.zero,
    datum: InlineDatum(
      VaultDatum {
        owner,
        principal_tusdm: 100_000_000,
        collateral_lovelace: 1_000_000_000,
        tier_at_open: Bronze,
      },
    ),
    reference_script: None,
  }
}

const reputation_addr: Address =
  Address {
    payment_credential: VerificationKey(
      #"22222222222222222222222222222222222222222222222222222222",
    ),
    stake_credential: None,
  }

fn reputation_ref() -> OutputReference {
  OutputReference {
    transaction_id: #"3333333333333333333333333333333333333333333333333333333333333333",
    output_index: 0,
  }
}

fn reputation_input(datum: ReputationDatum) -> Input {
  Input {
    output_reference: reputation_ref(),
    output: Output {
      address: reputation_addr,
      value: assets.zero,
      datum: InlineDatum(datum),
      reference_script: None,
    },
  }
}

fn reputation_output(datum: ReputationDatum) -> Output {
  Output {
    address: reputation_addr,
    value: assets.zero,
    datum: InlineDatum(datum),
    reference_script: None,
  }
}

test update_outside_repay_tx_fails() {
  let datum =
    ReputationDatum {
      owner: test_owner,
      cumulative_repaid: 0,
      loans_repaid: 0,
      first_seen: 0,
      tier: Bronze,
    }

  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [reputation_input(datum)],
      outputs: [reputation_output(datum)],
    }

  !reputation.spend(Some(datum), Void, reputation_ref(), tx)
}

test update_inside_repay_tx_increments_fields() {
  let vault_ref = dummy_output_ref()

  let vault_in =
    Input { output_reference: vault_ref, output: vault_output(test_owner) }

  let datum =
    ReputationDatum {
      owner: test_owner,
      cumulative_repaid: 0,
      loans_repaid: 0,
      first_seen: 0,
      tier: Bronze,
    }

  let expected_datum =
    ReputationDatum { ..datum, cumulative_repaid: 100_000_000 }

  let repay_redeemer: Redeemer = Repay(100_000_000)

  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [vault_in, reputation_input(datum)],
      outputs: [reputation_output(expected_datum)],
      redeemers: [Pair(Spend(vault_ref), repay_redeemer)],
    }

  reputation.spend(Some(datum), Void, reputation_ref(), tx)
}

test update_with_wrong_arithmetic_fails() {
  let vault_ref = dummy_output_ref()

  let vault_in =
    Input { output_reference: vault_ref, output: vault_output(test_owner) }

  let datum =
    ReputationDatum {
      owner: test_owner,
      cumulative_repaid: 0,
      loans_repaid: 0,
      first_seen: 0,
      tier: Bronze,
    }

  // Repaid 100, but the recreated datum only credits 50 - must fail.
  let wrong_datum = ReputationDatum { ..datum, cumulative_repaid: 50_000_000 }

  let repay_redeemer: Redeemer = Repay(100_000_000)

  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [vault_in, reputation_input(datum)],
      outputs: [reputation_output(wrong_datum)],
      redeemers: [Pair(Spend(vault_ref), repay_redeemer)],
    }

  !reputation.spend(Some(datum), Void, reputation_ref(), tx)
}

test update_inside_repay_tx_wrong_owner_fails() {
  let vault_ref = dummy_output_ref()

  let vault_in =
    Input { output_reference: vault_ref, output: vault_output(other_owner) }

  let datum =
    ReputationDatum {
      owner: test_owner,
      cumulative_repaid: 0,
      loans_repaid: 0,
      first_seen: 0,
      tier: Bronze,
    }

  let repay_redeemer: Redeemer = Repay(100_000_000)

  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [vault_in, reputation_input(datum)],
      outputs: [reputation_output(datum)],
      redeemers: [Pair(Spend(vault_ref), repay_redeemer)],
    }

  !reputation.spend(Some(datum), Void, reputation_ref(), tx)
}

test update_inside_close_tx_succeeds() {
  let vault_ref = dummy_output_ref()

  let vault_in =
    Input { output_reference: vault_ref, output: vault_output(test_owner) }

  let datum =
    ReputationDatum {
      owner: test_owner,
      cumulative_repaid: 500_000_000,
      loans_repaid: 1,
      first_seen: 0,
      tier: Bronze,
    }

  // 500 tUSDM repaid + 2 loans crosses the Silver threshold.
  let expected_datum =
    ReputationDatum { ..datum, loans_repaid: 2, tier: Silver }

  let close_redeemer: Redeemer = Close

  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [vault_in, reputation_input(datum)],
      outputs: [reputation_output(expected_datum)],
      redeemers: [Pair(Spend(vault_ref), close_redeemer)],
    }

  reputation.spend(Some(datum), Void, reputation_ref(), tx)
}

test update_inside_borrow_tx_fails() {
  let vault_ref = dummy_output_ref()

  let vault_in =
    Input { output_reference: vault_ref, output: vault_output(test_owner) }

  let datum =
    ReputationDatum {
      owner: test_owner,
      cumulative_repaid: 0,
      loans_repaid: 0,
      first_seen: 0,
      tier: Bronze,
    }

  let borrow_redeemer: Redeemer = Borrow

  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [vault_in, reputation_input(datum)],
      outputs: [reputation_output(datum)],
      redeemers: [Pair(Spend(vault_ref), borrow_redeemer)],
    }

  !reputation.spend(Some(datum), Void, reputation_ref(), tx)
}

test tier_recomputes_correctly() {
  and {
    tier_of(0, 0) == Bronze,
    tier_of(500_000_000, 2) == Silver,
    tier_of(2_000_000_000, 5) == Gold,
    tier_of(499_000_000, 2) == Bronze,
  }
}
