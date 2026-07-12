//// One-time CIP-68 minting-policy logic for the launchpad.
////
//// A token launch mints two assets under a single, per-token policy id:
////   - a reference token (CIP-68 label 100) that carries the metadata datum, and
////   - the fungible user token (CIP-68 label 222) — the meme coin itself.
////
//// The policy is parameterized by a `seed` output reference that must be spent
//// in the minting transaction. Because a UTxO can only ever be spent once, the
//// policy can only ever succeed once, so the supply is permanently fixed and the
//// token can never be re-minted or burned.

use aiken/collection/dict
use aiken/collection/list
use cardano/address.{Address, VerificationKey}
use cardano/assets.{PolicyId}
use cardano/transaction.{Input, NoDatum, Output, OutputReference, Transaction}

/// Fixed total supply of the fungible user token (label 222). Decimals = 0, so
/// this is the raw on-chain quantity: one billion whole tokens.
pub const total_supply: Int = 1_000_000_000

/// A launch mint is valid when:
///   1. the `seed` UTxO is consumed by this transaction (one-time guarantee), and
///   2. exactly two assets are minted under `policy_id`: one with quantity 1 (the
///      reference token) and one with quantity `total_supply` (the user token).
///
/// The CIP-68 asset-name labels (100 / 222) and the metadata datum are set by the
/// off-chain builder; on-chain we constrain uniqueness and the exact amounts so
/// no extra or mislabelled quantity can be minted under this policy.
pub fn is_valid_mint(
  seed: OutputReference,
  self: Transaction,
  policy_id: PolicyId,
) -> Bool {
  let consumes_seed =
    list.any(self.inputs, fn(input) { input.output_reference == seed })

  let valid_amounts =
    when dict.values(assets.tokens(self.mint, policy_id)) is {
      [a, b] -> (a == 1 && b == total_supply) || (a == total_supply && b == 1)
      _ -> False
    }

  consumes_seed && valid_amounts
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const test_policy: PolicyId =
  #"11111111111111111111111111111111111111111111111111111111"

const ref_name: ByteArray = #"000643b0cafe"

const usr_name: ByteArray = #"000de140cafe"

const seed_ref: OutputReference =
  OutputReference {
    transaction_id: #"2222222222222222222222222222222222222222222222222222222222222222",
    output_index: 0,
  }

fn mock_output() -> Output {
  Output {
    address: Address {
      payment_credential: VerificationKey(
        #"33333333333333333333333333333333333333333333333333333333",
      ),
      stake_credential: None,
    },
    value: assets.zero,
    datum: NoDatum,
    reference_script: None,
  }
}

fn seed_input() -> Input {
  Input { output_reference: seed_ref, output: mock_output() }
}

fn tx(inputs: List<Input>, mint: assets.Value) -> Transaction {
  Transaction { ..transaction.placeholder, inputs: inputs, mint: mint }
}

fn full_mint() -> assets.Value {
  assets.from_asset(test_policy, ref_name, 1)
    |> assets.merge(assets.from_asset(test_policy, usr_name, total_supply))
}

test valid_mint_succeeds() {
  is_valid_mint(seed_ref, tx([seed_input()], full_mint()), test_policy)
}

test fails_without_seed() {
  let other_input =
    Input {
      output_reference: OutputReference {
        transaction_id: #"9999999999999999999999999999999999999999999999999999999999999999",
        output_index: 3,
      },
      output: mock_output(),
    }
  !is_valid_mint(seed_ref, tx([other_input], full_mint()), test_policy)
}

test fails_on_wrong_supply() {
  let bad =
    assets.from_asset(test_policy, ref_name, 1)
      |> assets.merge(assets.from_asset(test_policy, usr_name, 42))
  !is_valid_mint(seed_ref, tx([seed_input()], bad), test_policy)
}

test fails_on_extra_token() {
  let extra =
    full_mint()
      |> assets.merge(assets.from_asset(test_policy, #"000de140beef", 1))
  !is_valid_mint(seed_ref, tx([seed_input()], extra), test_policy)
}

test fails_on_missing_reference_token() {
  // Only the user token minted, no reference token -> single entry -> invalid.
  let only_user = assets.from_asset(test_policy, usr_name, total_supply)
  !is_valid_mint(seed_ref, tx([seed_input()], only_user), test_policy)
}
