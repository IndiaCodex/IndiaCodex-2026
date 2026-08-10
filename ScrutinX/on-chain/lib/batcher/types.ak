//// Datum / redeemer types for the batch settlement validator.
//// These MUST byte-match the Data.Object schemas in demo-app/lib/agent/settlement.ts.

use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference}

pub type Status {
  Open
  Claimed
}

/// Datum on each ticket UTXO sitting at the script address.
pub type BatchDatum {
  owner: VerificationKeyHash,
  item_id: ByteArray,
  status: Status,
}

/// One entry in the batch: "this input UTXO is being claimed by this key."
pub type ClaimEntry {
  utxo_ref: OutputReference,
  claimant: VerificationKeyHash,
}

/// The redeemer carries the whole batch settled in this transaction.
pub type BatchRedeemer {
  claims: List<ClaimEntry>,
}
