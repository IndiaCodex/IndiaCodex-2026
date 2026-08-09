//// Launchpad CIP-68 minting policy.
////
//// Parameterized by a `seed` output reference (applied off-chain from a UTxO in
//// the launcher's wallet) so every launched token gets a unique policy id and
//// can only ever be minted once. See `launchpad/mint` for the validation rules.

use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}
use launchpad/mint

validator launchpad_mint(seed: OutputReference) {
  mint(_redeemer: Data, policy_id: PolicyId, self: Transaction) {
    mint.is_valid_mint(seed, self, policy_id)
  }
}
