use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{VerificationKey}

type VerificationKeyHash = Hash<Blake2b_224, VerificationKey>

/// Validator that controls the minting of credential/certificate NFTs.
/// The script checks that the minting tx is signed by the authorized platform authority.
validator(authority: VerificationKeyHash) {
  fn mint(_redeemer: Void, context: ScriptContext) -> Bool {
    let tx = context.transaction
    list.has(tx.extra_signatories, authority)
  }
}
