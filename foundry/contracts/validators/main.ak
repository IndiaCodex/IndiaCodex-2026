use aiken/transaction.{ScriptContext}
use aiken/crypto.{VerificationKeyHash}

/// Main entry point that delegates to specialized validators.
/// This is the primary spending validator for the Foundry project.
validator(owner: VerificationKeyHash) {
  /// Accept any transaction signed by the owner.
  /// Used for simple payment forwarding and administration.
  pub fn spend(_datum: (), _redeemer: (), context: ScriptContext) -> Bool {
    let tx = context.transaction
    tx.extra_signatories
      |> list.member(owner)
  }
}
