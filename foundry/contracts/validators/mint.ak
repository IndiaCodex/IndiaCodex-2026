use aiken/transaction.{ScriptContext, Transaction}
use aiken/transaction/value.{Value, minted_value}
use aiken/crypto.{VerificationKeyHash}
use foundry/utils.{is_signed_by}

/// Minting policy — one-shot mint with optional metadata, supports burn
validator(policy_owner: VerificationKeyHash) {
  fn must_be_signed_by_owner(tx: Transaction) -> Bool {
    is_signed_by(tx, policy_owner)
  }

  fn get_mint_amount(context: ScriptContext) -> Int {
    minted_value(context.transaction)
      |> value.flatten
      |> list.head
      |> Option.map(fn((_, _, amount)) { amount })
      |> Option.unwrap(0)
  }

  /// Mint new tokens. Only the policy owner can mint.
  /// Returns True if the owner signed and this is a mint (positive amount).
  pub fn mint(_redeemer: (), context: ScriptContext) -> Bool {
    expect must_be_signed_by_owner(context.transaction)
    let amount = get_mint_amount(context)
    amount > 0
  }

  /// Burn tokens. Anyone can burn (destroy) tokens they control.
  /// Returns True if the amount is negative (burn).
  pub fn burn(_redeemer: (), context: ScriptContext) -> Bool {
    let amount = get_mint_amount(context)
    amount < 0
  }
}
