use aiken/crypto.{VerificationKeyHash}

pub type Tier {
  Bronze
  Silver
  Gold
}

pub type VaultDatum {
  owner: VerificationKeyHash,
  principal_tusdm: Int,
  collateral_lovelace: Int,
  tier_at_open: Tier,
}

pub type VaultRedeemer {
  Borrow
  Repay(Int)
  Harvest
  Close
}

pub type ReserveRedeemer {
  MintForBorrow
  BurnForRepay
}
