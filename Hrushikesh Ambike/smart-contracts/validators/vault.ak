use aiken/collection/list
use aiken/collection/pairs
use aiken/crypto.{ScriptHash, VerificationKeyHash}
use aiken/interval.{Finite, Interval, IntervalBound}
use cardano/address
use cardano/address.{Address, Credential, Script}
use cardano/assets
use cardano/assets.{AssetName, PolicyId, quantity_of}
use cardano/certificate.{Certificate}
use cardano/transaction
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Spend, Transaction,
}
use oracle.{PriceDatum}
use ouro/ltv.{max_borrow}
use ouro/types.{
  Borrow, Bronze, Close, Gold, Harvest, Repay, VaultDatum, VaultRedeemer,
}
use reputation.{ReputationDatum}

const origination_fee_bps: Int = 100

const protocol_yield_share_bps: Int = 1500

// tUSDM value credited to the borrower's wallet after the 1% origination
// fee is deducted from the gross (debt-recorded) borrow amount.
pub fn net_after_fee(gross: Int) -> Int {
  gross - gross * origination_fee_bps / 10000
}

pub fn collateral_usd_value(collateral_lovelace: Int, price_micro_usd: Int) -> Int {
  collateral_lovelace * price_micro_usd / 1_000_000
}

// Reads the ADA/USD price posted by ouro_oracle (validators/oracle.ak) from
// a reference input at that script's address. Returns None for a stale
// price (past its valid_until_slot given the tx's own validity range) so
// callers can gracefully reject the action instead of crashing the whole
// script - staleness is a legitimate business condition a real transaction
// can hit, not a structural invariant violation.
fn read_oracle_price(self: Transaction, oracle_hash: ScriptHash) -> Option<Int> {
  expect Some(price_input) =
    self.reference_inputs
      |> list.find(
          fn(input) {
            input.output.address.payment_credential == Script(oracle_hash)
          },
        )
  expect InlineDatum(raw) = price_input.output.datum
  expect price: PriceDatum = raw
  expect Finite(upper) = self.validity_range.upper_bound.bound_type
  if upper <= price.valid_until_slot {
    Some(price.price_micro_usd)
  } else {
    None
  }
}

// Reads the borrower's on-chain reputation (validators/reputation.ak) as a
// reference input, keyed by owner. A brand-new borrower with no reputation
// UTxO yet defaults to Bronze / 0 cumulative_repaid - reputation is earned,
// never assumed.
fn read_reputation(
  self: Transaction,
  reputation_hash: ScriptHash,
  owner: VerificationKeyHash,
) -> ReputationDatum {
  let found =
    self.reference_inputs
      |> list.find(
          fn(input) {
            when input.output.address.payment_credential is {
              Script(hash) ->
                hash == reputation_hash && when input.output.datum is {
                  InlineDatum(raw) ->
                    if raw is d: ReputationDatum {
                      d.owner == owner
                    } else {
                      False
                    }
                  _ -> False
                }
              _ -> False
            }
          },
        )
  when found is {
    None ->
      ReputationDatum {
        owner,
        cumulative_repaid: 0,
        loans_repaid: 0,
        first_seen: 0,
        tier: Bronze,
      }
    Some(input) -> {
      expect InlineDatum(raw) = input.output.datum
      expect d: ReputationDatum = raw
      d
    }
  }
}

fn own_address(self: Transaction, own_ref: OutputReference) -> Address {
  expect Some(own_input) =
    self.inputs |> list.find(fn(input) { input.output_reference == own_ref })
  own_input.output.address
}

fn continuing_datum(self: Transaction, own_addr: Address) -> VaultDatum {
  expect Some(own_output) =
    self.outputs |> list.find(fn(output) { output.address == own_addr })
  expect InlineDatum(raw) = own_output.datum
  expect datum: VaultDatum = raw
  datum
}

fn borrow_ok(
  d: VaultDatum,
  own_ref: OutputReference,
  tusdm_policy: PolicyId,
  tusdm_asset_name: AssetName,
  oracle_hash: ScriptHash,
  reputation_hash: ScriptHash,
  self: Transaction,
) -> Bool {
  when read_oracle_price(self, oracle_hash) is {
    None -> False
    Some(price) -> {
      let own_addr = own_address(self, own_ref)
      let new_datum = continuing_datum(self, own_addr)
      let reputation = read_reputation(self, reputation_hash, d.owner)

      let gross = new_datum.principal_tusdm - d.principal_tusdm
      let net = net_after_fee(gross)
      let collateral_usd = collateral_usd_value(d.collateral_lovelace, price)
      let limit =
        max_borrow(collateral_usd, reputation.tier, reputation.cumulative_repaid)

      let signed_by_owner = list.has(self.extra_signatories, d.owner)
      let collateral_unchanged =
        new_datum.collateral_lovelace == d.collateral_lovelace
      let owner_unchanged = new_datum.owner == d.owner
      let minted_matches_net =
        quantity_of(self.mint, tusdm_policy, tusdm_asset_name) == net

      and {
        signed_by_owner,
        collateral_unchanged,
        owner_unchanged,
        gross > 0,
        gross <= limit,
        minted_matches_net,
      }
    }
  }
}

fn repay_ok(
  d: VaultDatum,
  own_ref: OutputReference,
  tusdm_policy: PolicyId,
  tusdm_asset_name: AssetName,
  amount: Int,
  self: Transaction,
) -> Bool {
  let own_addr = own_address(self, own_ref)
  let new_datum = continuing_datum(self, own_addr)

  // Burns are a negative mint quantity in the same transaction - repaid
  // tUSDM must actually leave circulation, not just get sent somewhere
  // unaccounted for.
  let burned_matches =
    quantity_of(self.mint, tusdm_policy, tusdm_asset_name) == -amount

  and {
    amount > 0,
    amount <= d.principal_tusdm,
    new_datum.principal_tusdm == d.principal_tusdm - amount,
    new_datum.collateral_lovelace == d.collateral_lovelace,
    new_datum.owner == d.owner,
    burned_matches,
  }
}

fn close_ok(d: VaultDatum, self: Transaction) -> Bool {
  d.principal_tusdm == 0 && list.has(self.extra_signatories, d.owner)
}

// Harvest: the vault's own staking rewards (withdrawn from ITS OWN reward
// account, in the same tx, per the "withdraw zero trick" - see
// vault_stake_ok below) pay down the debt automatically. protocol keeps
// protocol_yield_share_bps (15%) of the reward's USD value as revenue, the
// rest reduces principal_tusdm - clamped at 0, debt never goes negative.
// Permissionless by design (no owner signature required): self-repay is
// meant to be automatic, triggerable by anyone (e.g. a keeper bot), not
// something the user must manually re-sign each epoch.
fn harvest_ok(
  d: VaultDatum,
  own_ref: OutputReference,
  tusdm_policy: PolicyId,
  oracle_hash: ScriptHash,
  self: Transaction,
) -> Bool {
  when read_oracle_price(self, oracle_hash) is {
    None -> False
    Some(price) -> {
      let own_addr = own_address(self, own_ref)
      expect Script(own_hash) = own_addr.payment_credential
      expect Some(withdrawn) =
        pairs.get_first(self.withdrawals, Script(own_hash))

      let reward_usd = withdrawn * price / 1_000_000
      let protocol_share = reward_usd * protocol_yield_share_bps / 10000
      let repay_amount = reward_usd - protocol_share
      let expected_principal =
        if repay_amount >= d.principal_tusdm {
          0
        } else {
          d.principal_tusdm - repay_amount
        }

      let new_datum = continuing_datum(self, own_addr)
      let datum_ok =
        new_datum.principal_tusdm == expected_principal && new_datum.collateral_lovelace == d.collateral_lovelace && new_datum.owner == d.owner

      // The harvested ADA must actually leave to the reserve (tusdm_policy
      // is the reserve script's own hash) - it compensates the reserve for
      // the debt it's forgiving. Without this check, a user could reduce
      // their debt and simply keep the harvested ADA for free.
      let reserve_credential = Script(tusdm_policy)
      let paid_to_reserve =
        self.outputs
          |> list.any(
              fn(output) {
                output.address.payment_credential == reserve_credential && assets.lovelace_of(
                  output.value,
                ) >= withdrawn
              },
            )

      datum_ok && paid_to_reserve
    }
  }
}

// Publish: authorizes registering/delegating THIS vault's own stake
// credential. Only the owner may choose delegation - Certifying dispatch
// only ever calls this for certificates targeting this validator's own
// credential, so there's no "foreign certificate" case to separately guard.
fn publish_ok(owner: VerificationKeyHash, self: Transaction) -> Bool {
  list.has(self.extra_signatories, owner)
}

validator ouro_vault(
  owner: VerificationKeyHash,
  tusdm_policy: PolicyId,
  tusdm_asset_name: AssetName,
  oracle_hash: ScriptHash,
  reputation_hash: ScriptHash,
) {
  spend(
    datum: Option<VaultDatum>,
    r: VaultRedeemer,
    own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(d) = datum
    when r is {
      Borrow ->
        borrow_ok(
          d,
          own_ref,
          tusdm_policy,
          tusdm_asset_name,
          oracle_hash,
          reputation_hash,
          self,
        )
      Repay(amount) ->
        repay_ok(d, own_ref, tusdm_policy, tusdm_asset_name, amount, self)
      Close -> close_ok(d, self)
      Harvest -> harvest_ok(d, own_ref, tusdm_policy, oracle_hash, self)
    }
  }

  publish(_redeemer: Data, _certificate: Certificate, self: Transaction) {
    publish_ok(owner, self)
  }

  withdraw(_redeemer: Data, _account: Credential, self: Transaction) {
    // Withdraw-zero-trick: the real Harvest logic runs in `spend` above;
    // this just requires that a companion Harvest spend is present
    // somewhere in the transaction (permissionless keepers can trigger a
    // harvest, matching the "self-repaying" product design - no signature
    // requirement here).
    self.redeemers
      |> list.any(
          fn(pair) {
            when pair.1st is {
              Spend(_) ->
                if pair.2nd is r: VaultRedeemer {
                  r == Harvest
                } else {
                  False
                }
              _ -> False
            }
          },
        )
  }

  else(_) {
    fail
  }
}

const fake_owner =
  #"cc000000000000000000000000000000000000000000000000000000"

const fake_tusdm_policy: PolicyId =
  #"dd000000000000000000000000000000000000000000000000000000"

const fake_tusdm_name: AssetName = #"745553444d"

const fake_oracle_hash: ScriptHash =
  #"ee000000000000000000000000000000000000000000000000000000"

const fake_reputation_hash: ScriptHash =
  #"11000000000000000000000000000000000000000000000000000000"

const fake_own_ref: OutputReference =
  OutputReference {
    transaction_id: #"ee00000000000000000000000000000000000000000000000000000000000000",
    output_index: 0,
  }

const fake_vault_addr: Address =
  Address {
    payment_credential: address.Script(
      #"ff000000000000000000000000000000000000000000000000000000",
    ),
    stake_credential: None,
  }

fn fixed_validity_range(slot: Int) -> Interval {
  Interval {
    ..transaction.placeholder.validity_range,
    upper_bound: IntervalBound {
      bound_type: Finite(slot),
      is_inclusive: True,
    },
  }
}

fn oracle_ref_input(price_micro_usd: Int, valid_until_slot: Int) -> Input {
  Input {
    output_reference: OutputReference {
      transaction_id: #"aa00000000000000000000000000000000000000000000000000000000000000",
      output_index: 0,
    },
    output: Output {
      address: address.from_script(fake_oracle_hash),
      value: assets.zero,
      datum: InlineDatum(PriceDatum { price_micro_usd, valid_until_slot }),
      reference_script: None,
    },
  }
}

fn base_datum(principal: Int) -> VaultDatum {
  VaultDatum {
    owner: fake_owner,
    principal_tusdm: principal,
    collateral_lovelace: 1_000_000_000,
    tier_at_open: Bronze,
  }
}

fn base_tx(new_principal: Int, minted: Int) -> Transaction {
  let own_input =
    Input {
      output_reference: fake_own_ref,
      output: Output {
        address: fake_vault_addr,
        value: assets.zero,
        datum: InlineDatum(base_datum(0)),
        reference_script: None,
      },
    }
  let new_datum = base_datum(new_principal)
  let continuing_output =
    Output {
      address: fake_vault_addr,
      value: assets.zero,
      datum: InlineDatum(new_datum),
      reference_script: None,
    }
  Transaction {
    ..transaction.placeholder,
    inputs: [own_input],
    outputs: [continuing_output],
    reference_inputs: [oracle_ref_input(400_000, 1_000_000)],
    validity_range: fixed_validity_range(500_000),
    extra_signatories: [fake_owner],
    mint: assets.from_asset(fake_tusdm_policy, fake_tusdm_name, minted),
  }
}

test borrow_within_bronze_ltv_ok() {
  // 1000 ADA @ $0.40 = $400 collateral_usd; Bronze 50% = 200 tUSDM gross;
  // net after 1% fee = 198.
  let self = base_tx(200_000_000, 198_000_000)
  borrow_ok(
    base_datum(0),
    fake_own_ref,
    fake_tusdm_policy,
    fake_tusdm_name,
    fake_oracle_hash,
    fake_reputation_hash,
    self,
  )
}

test borrow_over_ltv_fails() {
  // 250 gross > 200 limit -> must fail.
  let self = base_tx(250_000_000, 247_500_000)
  !borrow_ok(
    base_datum(0),
    fake_own_ref,
    fake_tusdm_policy,
    fake_tusdm_name,
    fake_oracle_hash,
    fake_reputation_hash,
    self,
  )
}

test borrow_with_stale_oracle_price_fails() {
  let stale_tx =
    Transaction {
      ..base_tx(200_000_000, 198_000_000),
      reference_inputs: [oracle_ref_input(400_000, 100)],
      validity_range: fixed_validity_range(500_000),
    }
  !borrow_ok(
    base_datum(0),
    fake_own_ref,
    fake_tusdm_policy,
    fake_tusdm_name,
    fake_oracle_hash,
    fake_reputation_hash,
    stale_tx,
  )
}

test borrow_with_gold_reputation_unlocks_credit_line() {
  // Gold reputation (>=5 loans, >=2000 tUSDM repaid): 80% LTV + credit
  // line. 1000 ADA @ $0.40 = $400 collateral_usd; 80% = 320; credit_line =
  // min(25, 10% of 2500) = 25 -> limit 345.
  let reputation_datum =
    ReputationDatum {
      owner: fake_owner,
      cumulative_repaid: 2_500_000_000,
      loans_repaid: 5,
      first_seen: 0,
      tier: Gold,
    }
  let reputation_ref_input =
    Input {
      output_reference: OutputReference {
        transaction_id: #"5500000000000000000000000000000000000000000000000000000000000000",
        output_index: 0,
      },
      output: Output {
        address: address.from_script(fake_reputation_hash),
        value: assets.zero,
        datum: InlineDatum(reputation_datum),
        reference_script: None,
      },
    }
  let self =
    Transaction {
      ..base_tx(345_000_000, 341_550_000),
      reference_inputs: [
        oracle_ref_input(400_000, 1_000_000), reputation_ref_input,
      ],
    }
  borrow_ok(
    base_datum(0),
    fake_own_ref,
    fake_tusdm_policy,
    fake_tusdm_name,
    fake_oracle_hash,
    fake_reputation_hash,
    self,
  )
}

test borrow_ignores_reputation_for_different_owner() {
  // A reputation UTxO for a DIFFERENT owner must not be picked up - falls
  // back to Bronze/0, so the Gold-sized borrow above the Bronze limit
  // must fail.
  let other_owner =
    #"99000000000000000000000000000000000000000000000000000000"
  let reputation_datum =
    ReputationDatum {
      owner: other_owner,
      cumulative_repaid: 2_500_000_000,
      loans_repaid: 5,
      first_seen: 0,
      tier: Gold,
    }
  let reputation_ref_input =
    Input {
      output_reference: OutputReference {
        transaction_id: #"5500000000000000000000000000000000000000000000000000000000000000",
        output_index: 0,
      },
      output: Output {
        address: address.from_script(fake_reputation_hash),
        value: assets.zero,
        datum: InlineDatum(reputation_datum),
        reference_script: None,
      },
    }
  let self =
    Transaction {
      ..base_tx(345_000_000, 341_550_000),
      reference_inputs: [
        oracle_ref_input(400_000, 1_000_000), reputation_ref_input,
      ],
    }
  !borrow_ok(
    base_datum(0),
    fake_own_ref,
    fake_tusdm_policy,
    fake_tusdm_name,
    fake_oracle_hash,
    fake_reputation_hash,
    self,
  )
}

test origination_fee_is_one_percent() {
  net_after_fee(200_000_000) == 198_000_000
}

fn repay_tx(new_principal: Int, burned: Int) -> Transaction {
  let own_input =
    Input {
      output_reference: fake_own_ref,
      output: Output {
        address: fake_vault_addr,
        value: assets.zero,
        datum: InlineDatum(base_datum(200_000_000)),
        reference_script: None,
      },
    }
  let continuing_output =
    Output {
      address: fake_vault_addr,
      value: assets.zero,
      datum: InlineDatum(base_datum(new_principal)),
      reference_script: None,
    }
  Transaction {
    ..transaction.placeholder,
    inputs: [own_input],
    outputs: [continuing_output],
    // Burns are a negative mint quantity.
    mint: assets.from_asset(fake_tusdm_policy, fake_tusdm_name, -burned),
  }
}

test repay_reduces_debt_and_burns_exact_amount() {
  let self = repay_tx(100_000_000, 100_000_000)
  repay_ok(
    base_datum(200_000_000),
    fake_own_ref,
    fake_tusdm_policy,
    fake_tusdm_name,
    100_000_000,
    self,
  )
}

test repay_without_burning_fails() {
  let self = repay_tx(100_000_000, 0)
  !repay_ok(
    base_datum(200_000_000),
    fake_own_ref,
    fake_tusdm_policy,
    fake_tusdm_name,
    100_000_000,
    self,
  )
}

test repay_with_wrong_new_principal_fails() {
  // Burns the right amount but understates the new debt.
  let self = repay_tx(50_000_000, 100_000_000)
  !repay_ok(
    base_datum(200_000_000),
    fake_own_ref,
    fake_tusdm_policy,
    fake_tusdm_name,
    100_000_000,
    self,
  )
}

test repay_over_principal_fails() {
  let self = repay_tx(0, 250_000_000)
  !repay_ok(
    base_datum(200_000_000),
    fake_own_ref,
    fake_tusdm_policy,
    fake_tusdm_name,
    250_000_000,
    self,
  )
}

test close_requires_zero_debt() {
  let self =
    Transaction { ..transaction.placeholder, extra_signatories: [fake_owner] }
  !close_ok(base_datum(1), self) && close_ok(base_datum(0), self)
}

test publish_requires_owner_signature() {
  let signed =
    Transaction { ..transaction.placeholder, extra_signatories: [fake_owner] }
  let unsigned = Transaction { ..transaction.placeholder, extra_signatories: [] }
  publish_ok(fake_owner, signed) && !publish_ok(fake_owner, unsigned)
}

fn harvest_tx(
  withdrawn: Int,
  new_principal: Int,
  reserve_payout: Int,
) -> Transaction {
  let own_input =
    Input {
      output_reference: fake_own_ref,
      output: Output {
        address: fake_vault_addr,
        value: assets.zero,
        datum: InlineDatum(base_datum(200_000_000)),
        reference_script: None,
      },
    }
  let continuing_output =
    Output {
      address: fake_vault_addr,
      value: assets.zero,
      datum: InlineDatum(base_datum(new_principal)),
      reference_script: None,
    }
  let reserve_output =
    Output {
      address: address.from_script(fake_tusdm_policy),
      value: assets.from_lovelace(reserve_payout),
      datum: transaction.NoDatum,
      reference_script: None,
    }
  Transaction {
    ..transaction.placeholder,
    inputs: [own_input],
    outputs: [continuing_output, reserve_output],
    reference_inputs: [oracle_ref_input(400_000, 1_000_000)],
    validity_range: fixed_validity_range(500_000),
    withdrawals: [Pair(Script(#"ff000000000000000000000000000000000000000000000000000000"), withdrawn)],
  }
}

test harvest_reduces_debt_by_85pct_of_reward_value() {
  // 100 ADA reward @ $0.40 = $40 (40_000_000); 15% protocol = 6_000_000;
  // 85% repay = 34_000_000; 200_000_000 - 34_000_000 = 166_000_000.
  let self = harvest_tx(100_000_000, 166_000_000, 100_000_000)
  harvest_ok(
    base_datum(200_000_000),
    fake_own_ref,
    fake_tusdm_policy,
    fake_oracle_hash,
    self,
  )
}

test harvest_clamps_debt_at_zero() {
  // A huge reward whose 85% share exceeds the 200_000_000 principal.
  let self = harvest_tx(2_000_000_000, 0, 2_000_000_000)
  harvest_ok(
    base_datum(200_000_000),
    fake_own_ref,
    fake_tusdm_policy,
    fake_oracle_hash,
    self,
  )
}

test harvest_without_paying_reserve_fails() {
  let self = harvest_tx(100_000_000, 166_000_000, 0)
  !harvest_ok(
    base_datum(200_000_000),
    fake_own_ref,
    fake_tusdm_policy,
    fake_oracle_hash,
    self,
  )
}
