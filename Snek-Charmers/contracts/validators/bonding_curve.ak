//// Bonding-curve pool spend validator.
////
//// Every launched token's pool UTxO sits at this validator's address. A trade
//// spends the pool with a Buy/Sell redeemer and must re-create the pool with the
//// correct updated state (see `launchpad/curve`).

use cardano/transaction.{OutputReference, Transaction}
use launchpad/curve.{PoolDatum, PoolRedeemer}

validator bonding_curve {
  spend(
    datum: Option<PoolDatum>,
    redeemer: PoolRedeemer,
    own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(d) = datum
    curve.validate(d, redeemer, own_ref, self)
  }
}
