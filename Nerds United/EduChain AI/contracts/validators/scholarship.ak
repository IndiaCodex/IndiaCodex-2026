use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{VerificationKey}

type VerificationKeyHash = Hash<Blake2b_224, VerificationKey>

pub type ScholarshipDatum {
  student: VerificationKeyHash,
  escrow_admin: VerificationKeyHash,
  milestone_id: Int,
}

pub type ScholarshipRedeemer {
  Claim
  Refund
}

/// Spender validator that acts as an escrow contract for student scholarships/rewards.
validator {
  fn spend(
    datum: ScholarshipDatum,
    redeemer: ScholarshipRedeemer,
    context: ScriptContext,
  ) -> Bool {
    let tx = context.transaction

    when redeemer is {
      Claim -> {
        // Claiming funds requires signatures from both the student and the escrow platform
        list.has(tx.extra_signatories, datum.student) && list.has(
          tx.extra_signatories,
          datum.escrow_admin,
        )
      }
      Refund -> {
        // Escrow admin can claim a refund if terms are expired or unmet
        list.has(tx.extra_signatories, datum.escrow_admin)
      }
    }
  }
}
