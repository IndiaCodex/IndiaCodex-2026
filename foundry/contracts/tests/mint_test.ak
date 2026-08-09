use aiken/transaction.{Transaction, ScriptContext, ValidityRange}
use aiken/transaction/value.{Value}
use aiken/crypto.{VerificationKeyHash}
use foundry/validators/mint as mint_validator

const owner_bytes: ByteArray = #"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
let owner: VerificationKeyHash = VerificationKeyHash(owner_bytes)

fn make_tx(signatories: List<VerificationKeyHash>, mint_amount: Int) -> Transaction {
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
    mint: value.from_lovelace(mint_amount),
    script_data_hash: Option::None,
    collateral: [],
    collateral_return: Option::None,
    total_collateral: Option::None,
    reference_fee: Option::None,
    required_signers: [],
  }
}

test mint_with_owner_signature_succeeds() {
  let v = mint_validator(owner)
  let tx = make_tx([owner], 1_000_000)
  let ctx = ScriptContext { transaction: tx, purpose: Mint(Value(0, [])), redeemer: Void }
  v.mint((), ctx)
}

test mint_without_owner_signature_fails() {
  let other = VerificationKeyHash(#"fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210")
  let v = mint_validator(owner)
  let tx = make_tx([other], 1_000_000)
  let ctx = ScriptContext { transaction: tx, purpose: Mint(Value(0, [])), redeemer: Void }
  !v.mint((), ctx)
}

test burn_always_succeeds() {
  let v = mint_validator(owner)
  let tx = make_tx([], -1_000_000)
  let ctx = ScriptContext { transaction: tx, purpose: Mint(Value(0, [])), redeemer: Void }
  v.burn((), ctx)
}
