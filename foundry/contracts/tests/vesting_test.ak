use aiken/transaction.{Transaction, ScriptContext, ValidityRange}
use aiken/transaction/value.{Value}
use aiken/crypto.{VerificationKeyHash}
use foundry/validators/vesting as vesting_validator
use foundry/types.{VestingDatum}

const beneficiary_bytes: ByteArray = #"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
let beneficiary: VerificationKeyHash = VerificationKeyHash(beneficiary_bytes)

fn make_tx(signatories: List<VerificationKeyHash>, current_time: Int) -> Transaction {
  Transaction {
    inputs: [],
    outputs: [],
    fee: 0,
    ttl: Option::None,
    certificates: [],
    withdrawals: dict.new(),
    validity_range: ValidityRange { lower_bound: current_time, upper_bound: Option::None },
    extra_signatories: signatories,
    reference_inputs: [],
    mint: value.zero(),
    script_data_hash: Option::None,
    collateral: [],
    collateral_return: Option::None,
    total_collateral: Option::None,
    reference_fee: Option::None,
    required_signers: [],
  }
}

test init_vesting_with_zero_withdrawn_succeeds() {
  let v = vesting_validator(beneficiary)
  let tx = make_tx([beneficiary], 0)
  let ctx = ScriptContext { transaction: tx, purpose: Spend, redeemer: Void }
  v.init(
    VestingDatum {
      beneficiary: beneficiary,
      cliff_time: 1000,
      vesting_start: 1000,
      vesting_end: 10000,
      total_amount: 10_000_000,
      withdrawn: 0,
    },
    ctx,
  )
}

test cannot_withdraw_before_cliff() {
  let v = vesting_validator(beneficiary)
  let tx = make_tx([beneficiary], 500)
  let ctx = ScriptContext { transaction: tx, purpose: Spend, redeemer: Void }
  !v.withdraw(
    VestingDatum {
      beneficiary: beneficiary,
      cliff_time: 1000,
      vesting_start: 1000,
      vesting_end: 10000,
      total_amount: 10_000_000,
      withdrawn: 0,
    },
    ctx,
  )
}

test can_withdraw_after_cliff() {
  let v = vesting_validator(beneficiary)
  let tx = make_tx([beneficiary], 5000)
  let ctx = ScriptContext { transaction: tx, purpose: Spend, redeemer: Void }
  v.withdraw(
    VestingDatum {
      beneficiary: beneficiary,
      cliff_time: 1000,
      vesting_start: 1000,
      vesting_end: 10000,
      total_amount: 10_000_000,
      withdrawn: 0,
    },
    ctx,
  )
}
