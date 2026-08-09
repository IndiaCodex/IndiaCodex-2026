use aiken/transaction.{Transaction, OutputReference, ScriptContext, InlineDatum}
use aiken/transaction/value.{Value}
use aiken/address.{Address}
use aiken/crypto.{VerificationKeyHash}
use foundry/types.{LockDatum, TimeRange}
use foundry/utils.{is_signed_by, deadline_passed}

/// Lock validator — locks ADA until a deadline, unlockable by owner or beneficiaries
validator {
  owner: VerificationKeyHash,
  deadline: Int,
  beneficiaries: List<VerificationKeyHash>,
}

fn owner_signed(tx: Transaction) -> Bool {
  tx.extra_signatories
    |> list.member(owner)
}

fn beneficiary_signed(tx: Transaction) -> Bool {
  tx.extra_signatories
    |> list.any(fn(sig) { list.member(beneficiaries, sig) })
}

fn deadline_met(context: ScriptContext) -> Bool {
  deadline_passed(deadline, context.transaction.validity_range.lower_bound)
}

/// Mint a LockDatum and lock ADA.
/// Only the owner can lock initial funds.
pub fn lock(datum: LockDatum, tx: Transaction) -> Bool {
  expect owner_signed(tx)
  expect datum.owner == owner
  True
}

/// Unlock ADA. Either owner at any time, or beneficiaries after deadline.
pub fn unlock(_datum: LockDatum, _redeemer: (), context: ScriptContext) -> Bool {
  let tx = context.transaction
  let signed_by_owner = owner_signed(tx)
  let signed_by_beneficiary = beneficiary_signed(tx)
  let after_deadline = deadline_met(context)

  signed_by_owner || (signed_by_beneficiary && after_deadline)
}

/// Extend deadline. Only owner can extend (not shorten).
pub fn extend_deadline(new_deadline: Int, context: ScriptContext) -> Bool {
  expect owner_signed(context.transaction)
  new_deadline >= deadline
}
