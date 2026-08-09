use aiken/transaction.{Transaction, ScriptContext, ValidityRange, OutputReference}
use aiken/transaction/value.{Value}
use aiken/crypto.{VerificationKeyHash}
use foundry/validators/lock as lock_validator
use foundry/types.{LockDatum}

const owner_bytes: ByteArray = #"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
let owner: VerificationKeyHash = VerificationKeyHash(owner_bytes)

const other_bytes: ByteArray = #"fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
let other: VerificationKeyHash = VerificationKeyHash(other_bytes)

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

test owner_can_unlock_before_deadline() {
  let deadline = 1000
  let v = lock_validator(owner, deadline, [])
  let tx = make_tx([owner], 500)
  let ctx = ScriptContext { transaction: tx, purpose: Spend, redeemer: Void }
  v.unlock(
    LockDatum { owner: VerificationKeyHash(#"0000000000000000000000000000000000000000000000000000000000000000"), deadline: 1000, beneficiaries: [], amount: 0 },
    (),
    ctx,
  )
}

test beneficiary_can_unlock_after_deadline() {
  let deadline = 1000
  let v = lock_validator(owner, deadline, [other])
  let tx = make_tx([other], 1500)
  let ctx = ScriptContext { transaction: tx, purpose: Spend, redeemer: Void }
  v.unlock(
    LockDatum { owner: owner, deadline: 1000, beneficiaries: [other], amount: 0 },
    (),
    ctx,
  )
}

test beneficiary_cannot_unlock_before_deadline() {
  let deadline = 1000
  let v = lock_validator(owner, deadline, [other])
  let tx = make_tx([other], 500)
  let ctx = ScriptContext { transaction: tx, purpose: Spend, redeemer: Void }
  !v.unlock(
    LockDatum { owner: owner, deadline: 1000, beneficiaries: [other], amount: 0 },
    (),
    ctx,
  )
}
