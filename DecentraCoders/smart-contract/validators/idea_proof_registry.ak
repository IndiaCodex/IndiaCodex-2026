use aiken/collection/list
use aiken/primitive/bytearray
use cardano/transaction.{Transaction, OutputReference}
use types.{Datum, Redeemer}

validator idea_proof_registry {
  spend(
    datum: Option<Datum>,
    _redeemer: Redeemer,
    _own_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(d) = datum

    let hash_exists = !bytearray.is_empty(d.idea_hash)
    let hash_length_ok = bytearray.length(d.idea_hash) == 32
    let owner_pkh_ok = bytearray.length(d.owner_public_key_hash) == 28
    let signed_by_owner = list.has(tx.extra_signatories, d.owner_public_key_hash)

    hash_exists && hash_length_ok && owner_pkh_ok && signed_by_owner
  }
}
