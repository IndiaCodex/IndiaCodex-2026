use aiken/transaction.{Transaction, ScriptContext, ValidityRange}
use aiken/crypto.{VerificationKeyHash}
use foundry/validators/main as main_validator

const owner_bytes: ByteArray = #"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
let owner: VerificationKeyHash = VerificationKeyHash(owner_bytes)

fn make_dummy_tx(signatories: List<VerificationKeyHash>) -> Transaction {
  Transaction {
    inputs: [],
    outputs: [],
    fee: 0,
    ttl: Option::None,
    certificates: [],
    withdrawals: dict.new(),
    validity_range: ValidityRange { lower_bound: 0, upper_bound: Option::None },
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

test spending_with_owner_signature_succeeds() {
  let tx = make_dummy_tx([owner])
  let ctx = ScriptContext { transaction: tx, purpose: Spend, redeemer: Void }
  main_validator(owner).spend((), (), ctx)
}

test spending_without_owner_signature_fails() {
  let wrong_owner = VerificationKeyHash(#"fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210")
  let tx = make_dummy_tx([wrong_owner])
  let ctx = ScriptContext { transaction: tx, purpose: Spend, redeemer: Void }
  !main_validator(owner).spend((), (), ctx)
}
