pub type TimeRange {
  LowerBound: Int  // POSIX time in milliseconds
  UpperBound: Int
}

pub type AssetClass {
  policy_id: Hash<Blake2b_224>,
  asset_name: ByteArray,
}

pub type LockDatum {
  owner: Address,
  deadline: Int,          // POSIX time in ms
  beneficiaries: List<Address>,
  amount: Int,            // Lovelace
}

pub type VestingDatum {
  beneficiary: Address,
  cliff_time: Int,        // POSIX time in ms
  vesting_start: Int,     // POSIX time in ms
  vesting_end: Int,       // POSIX time in ms
  total_amount: Int,      // Lovelace
  withdrawn: Int,         // Already withdrawn
}

pub type MintAction {
  action: MintActionType,
  metadata: Option<ByteArray>,
}

pub type MintActionType {
  Mint
  Burn
}

pub type TimeLockConfig {
  owner: Address,
  unlock_time: Int,       // Earliest POSIX time in ms
  refund_time: Int,       // After this, owner can refund
  refund_address: Address,
}

pub type OracleDatum {
  provider: Address,
  asset_pair: ByteArray,  // e.g., "ADA/USD" encoded
  price: Int,             // Scaled by 1_000_000
  timestamp: Int,         // POSIX time in ms
  signature: ByteArray,
}
