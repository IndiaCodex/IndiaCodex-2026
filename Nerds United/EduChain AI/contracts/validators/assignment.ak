use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{VerificationKey}

type VerificationKeyHash = Hash<Blake2b_224, VerificationKey>

pub type AssignmentDatum {
  student: VerificationKeyHash,
  teacher: VerificationKeyHash,
  assignment_id: ByteArray,
  file_hash: ByteArray,
}

pub type AssignmentRedeemer {
  Grade
  Cancel
}

/// Spender validator controlling locking and unlocking of assignment proof UTXOs.
validator {
  fn spend(
    datum: AssignmentDatum,
    redeemer: AssignmentRedeemer,
    context: ScriptContext,
  ) -> Bool {
    let tx = context.transaction

    when redeemer is {
      Grade -> list.has(tx.extra_signatories, datum.teacher)
      Cancel -> list.has(tx.extra_signatories, datum.student)
    }
  }
}
