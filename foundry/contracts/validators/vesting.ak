use aiken/transaction.{ScriptContext, Transaction}
use aiken/crypto.{VerificationKeyHash}
use foundry/types.{VestingDatum}
use foundry.utils.{is_signed_by, calculate_withdrawn, deadline_passed}

/// Vesting contract — linearly vests ADA over time with a cliff period
validator(beneficiary: VerificationKeyHash) {
  fn is_beneficiary(tx: Transaction) -> Bool {
    is_signed_by(tx, beneficiary)
  }

  /// Initialize a vesting position. Must be signed by the beneficiary's initial funder.
  /// The datum specifies cliff_time, vesting_start, vesting_end, and total_amount.
  pub fn init(datum: VestingDatum, context: ScriptContext) -> Bool {
    expect datum.beneficiary == beneficiary
    expect datum.withdrawn == 0
    True
  }

  /// Withdraw vested tokens. Amount is calculated linearly between vesting_start and vesting_end.
  /// Before cliff_time, nothing can be withdrawn.
  /// After vesting_end, the full remaining amount can be withdrawn.
  pub fn withdraw(datum: VestingDatum, context: ScriptContext) -> Bool {
    expect is_beneficiary(context.transaction)

    let current_time = context.transaction.validity_range.lower_bound

    expect deadline_passed(datum.cliff_time, current_time)

    let available = calculate_withdrawn(
      datum.total_amount,
      datum.withdrawn,
      current_time,
      datum.vesting_start,
      datum.vesting_end,
    )

    expect available > 0
    True
  }
}
