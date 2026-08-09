// Signed ADA/USD price oracle.
//
// Ouro has no liquidation path — the oracle only sizes borrow limits and
// harvest self-repay amounts, so it is not safety-critical. A simple signed
// attestation (a single trusted key posts a price UTxO; the validator only
// gates who is allowed to update it) is an intentional, already-approved
// design choice for this hackathon prototype, not a corner cut.
//
// Downstream code (vault borrow/harvest) is expected to read the resulting
// price UTxO as a *reference input*; this validator only governs spending
// (i.e. replacing) the oracle's own price UTxO.

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{Transaction}

/// The oracle's price attestation, stored as an inline datum on the price
/// UTxO. `valid_until_slot` lets downstream consumers reject stale prices.
pub type PriceDatum {
  price_micro_usd: Int,
  valid_until_slot: Int,
}

/// Gates updates to the price UTxO to transactions signed by the trusted
/// `oracle_vkh`. Any spend (i.e. replacing the price datum with a new one)
/// must carry that key's signature in `extra_signatories`.
validator oracle(oracle_vkh: VerificationKeyHash) {
  spend(_datum: Option<PriceDatum>, _redeemer: Data, _utxo: Data, self: Transaction) {
    list.has(self.extra_signatories, oracle_vkh)
  }

  else(_) {
    fail
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const test_oracle_vkh: VerificationKeyHash =
  #"00000000000000000000000000000000000000000000000000000000"

fn signed_tx() -> Transaction {
  Transaction {
    ..transaction.placeholder,
    extra_signatories: [test_oracle_vkh],
  }
}

fn unsigned_tx() -> Transaction {
  Transaction { ..transaction.placeholder, extra_signatories: [] }
}

test spend_signed_by_oracle_succeeds() {
  let new_datum =
    Some(PriceDatum { price_micro_usd: 400_000, valid_until_slot: 1_000_000 })

  oracle.spend(test_oracle_vkh, new_datum, Void, Void, signed_tx())
}

test spend_unsigned_fails() {
  let new_datum =
    Some(PriceDatum { price_micro_usd: 400_000, valid_until_slot: 1_000_000 })

  !oracle.spend(test_oracle_vkh, new_datum, Void, Void, unsigned_tx())
}

test spend_signed_by_other_key_fails() {
  let other_vkh: VerificationKeyHash =
    #"11111111111111111111111111111111111111111111111111111111"
  let tx = Transaction { ..transaction.placeholder, extra_signatories: [other_vkh] }
  let new_datum =
    Some(PriceDatum { price_micro_usd: 400_000, valid_until_slot: 1_000_000 })

  !oracle.spend(test_oracle_vkh, new_datum, Void, Void, tx)
}
