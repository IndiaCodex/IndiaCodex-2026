//// Linear bonding-curve pool with FIXED protocol constants (same for every token)
//// and a graduation gate at 80% sold (pump.fun model).
////
//// Price of the next token (lovelace) = base_price + slope * sold, where
//// slope = slope_num / slope_den = 5 / 10_000_000 = 5e-7.
////   - initial price  P0 = 50 lovelace (0.00005 ADA)
////   - graduation     Pg = 50 + 5e-7 * 8e8 = 450 lovelace (0.00045 ADA, 9x)
////   - ADA raised at graduation ≈ 200,000 ADA
//// Fixed-point: the slope integral is computed exactly, then divided by slope_den
//// with rounding IN THE POOL'S FAVOUR (buy rounds up, sell rounds down).

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/address.{Address, VerificationKey}
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction.{InlineDatum, Input, Output, OutputReference,
  Transaction, find_input}
use launchpad/mint

pub type PoolDatum {
  token_policy: PolicyId,
  token_name: AssetName,
  sold: Int,
  reserve: Int,
  owner: VerificationKeyHash,
}

pub type PoolRedeemer {
  Buy { amount: Int }
  Sell { amount: Int }
  Graduate
}

pub const base_price: Int = 50

pub const slope_num: Int = 5

pub const slope_den: Int = 10_000_000

/// Tokens sellable on the curve before graduation: 80% of total supply (8e8).
pub const graduation_threshold: Int = mint.total_supply * 80 / 100

/// Exact integer numerator of the slope portion of the integral over [sold, sold+amount).
fn slope_integral(sold: Int, amount: Int) -> Int {
  slope_num * ( sold * amount + amount * ( amount - 1 ) / 2 )
}

/// Cost in lovelace to BUY `amount` tokens starting at `sold`. Rounds UP.
pub fn buy_cost(sold: Int, amount: Int) -> Int {
  base_price * amount + ( slope_integral(sold, amount) + slope_den - 1 ) / slope_den
}

/// Refund in lovelace to SELL `amount` tokens ending at `sold`. Rounds DOWN.
pub fn sell_refund(sold: Int, amount: Int) -> Int {
  base_price * amount + slope_integral(sold - amount, amount) / slope_den
}

pub fn validate(
  d: PoolDatum,
  redeemer: PoolRedeemer,
  own_ref: OutputReference,
  self: Transaction,
) -> Bool {
  when redeemer is {
    Buy { amount } -> validate_trade(d, own_ref, self, True, amount)
    Sell { amount } -> validate_trade(d, own_ref, self, False, amount)
    Graduate ->
      d.sold >= graduation_threshold && list.has(
        self.extra_signatories,
        d.owner,
      )
  }
}

fn validate_trade(
  d: PoolDatum,
  own_ref: OutputReference,
  self: Transaction,
  is_buy: Bool,
  amount: Int,
) -> Bool {
  expect Some(own_input) = find_input(self.inputs, own_ref)
  let pool_address = own_input.output.address

  expect [pool_out] =
    list.filter(self.outputs, fn(o) { o.address == pool_address })
  expect InlineDatum(raw) = pool_out.datum
  expect new_d: PoolDatum = raw

  let in_lovelace = assets.lovelace_of(own_input.output.value)
  let out_lovelace = assets.lovelace_of(pool_out.value)
  let in_tokens =
    assets.quantity_of(own_input.output.value, d.token_policy, d.token_name)
  let out_tokens =
    assets.quantity_of(pool_out.value, d.token_policy, d.token_name)

  let immutable_ok =
    new_d.token_policy == d.token_policy && new_d.token_name == d.token_name && new_d.owner == d.owner

  let action_ok =
    if is_buy {
      let price = buy_cost(d.sold, amount)
      and {
        amount > 0,
        d.sold + amount <= graduation_threshold,
        new_d.sold == d.sold + amount,
        new_d.reserve == d.reserve + price,
        out_lovelace == in_lovelace + price,
        out_tokens == in_tokens - amount,
      }
    } else {
      let refund = sell_refund(d.sold, amount)
      and {
        amount > 0,
        amount <= d.sold,
        d.sold < graduation_threshold,
        new_d.sold == d.sold - amount,
        new_d.reserve == d.reserve - refund,
        out_lovelace == in_lovelace - refund,
        out_tokens == in_tokens + amount,
      }
    }

  immutable_ok && action_ok
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const tk_policy: PolicyId =
  #"3f9c3bb0de7ca569d00726e852bdbf09278c3403c2344d6b191d7550"

const tk_name: AssetName = #"000de14050455045"

const owner_key: VerificationKeyHash =
  #"44444444444444444444444444444444444444444444444444444444"

const own_ref: OutputReference =
  OutputReference {
    transaction_id: #"2222222222222222222222222222222222222222222222222222222222222222",
    output_index: 0,
  }

const pool_addr: Address =
  Address {
    payment_credential: VerificationKey(
      #"33333333333333333333333333333333333333333333333333333333",
    ),
    stake_credential: None,
  }

fn pool_output(datum: PoolDatum, lovelace: Int, tokens: Int) -> Output {
  Output {
    address: pool_addr,
    value: assets.from_lovelace(lovelace)
      |> assets.merge(assets.from_asset(tk_policy, tk_name, tokens)),
    datum: InlineDatum(datum),
    reference_script: None,
  }
}

fn trade_tx(
  in_d: PoolDatum,
  in_lov: Int,
  in_tok: Int,
  out_d: PoolDatum,
  out_lov: Int,
  out_tok: Int,
) -> Transaction {
  Transaction {
    ..transaction.placeholder,
    inputs: [
      Input {
        output_reference: own_ref,
        output: pool_output(in_d, in_lov, in_tok),
      },
    ],
    outputs: [pool_output(out_d, out_lov, out_tok)],
  }
}

const buffer: Int = 2_000_000

const base_datum: PoolDatum =
  PoolDatum {
    token_policy: tk_policy,
    token_name: tk_name,
    sold: 0,
    reserve: 0,
    owner: owner_key,
  }

// P0 = 50 lovelace; buy 1,000,000 tokens ≈ 50.25 ADA (matches the spec table).
test cost_math() {
  buy_cost(0, 1) == 50 && buy_cost(0, 1_000_000) == 50_250_000 && sell_refund(
    1_000_000,
    1_000_000,
  ) == 50_249_999
}

test buy_valid() {
  let price = buy_cost(0, 1_000_000)
  let nd = PoolDatum { ..base_datum, sold: 1_000_000, reserve: price }
  validate(
    base_datum,
    Buy { amount: 1_000_000 },
    own_ref,
    trade_tx(
      base_datum,
      buffer,
      1_000_000_000,
      nd,
      buffer + price,
      1_000_000_000 - 1_000_000,
    ),
  )
}

test buy_underpay_fails() {
  let price = buy_cost(0, 1_000_000)
  let nd = PoolDatum { ..base_datum, sold: 1_000_000, reserve: price }
  !validate(
    base_datum,
    Buy { amount: 1_000_000 },
    own_ref,
    trade_tx(
      base_datum,
      buffer,
      1_000_000_000,
      nd,
      buffer + price - 1,
      1_000_000_000 - 1_000_000,
    ),
  )
}

test buy_past_threshold_fails() {
  let start = PoolDatum { ..base_datum, sold: graduation_threshold }
  let price = buy_cost(graduation_threshold, 1)
  let nd = PoolDatum { ..start, sold: graduation_threshold + 1, reserve: price }
  !validate(
    start,
    Buy { amount: 1 },
    own_ref,
    trade_tx(start, buffer, 200_000_000, nd, buffer + price, 200_000_000 - 1),
  )
}

test graduate_valid() {
  let d = PoolDatum { ..base_datum, sold: graduation_threshold }
  let tx =
    Transaction { ..transaction.placeholder, extra_signatories: [owner_key] }
  validate(d, Graduate, own_ref, tx)
}

test graduate_unsigned_fails() {
  let d = PoolDatum { ..base_datum, sold: graduation_threshold }
  !validate(d, Graduate, own_ref, transaction.placeholder)
}
