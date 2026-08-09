use aiken/collection.{dict, Dict}
use aiken/transaction.{Transaction}
use aiken/transaction/value.{Value}
use aiken/crypto.{VerificationKeyHash}

/// Check if a transaction is signed by a given address's verification key
pub fn is_signed_by(tx: Transaction, expected: VerificationKeyHash) -> Bool {
  tx.extra_signatories
    |> list.member(expected)
}

/// Check if the current time is after a given deadline
pub fn deadline_passed(deadline: Int, current_time: Int) -> Bool {
  current_time >= deadline
}

/// Check if the current time is within a valid range
pub fn within_time_range(lower: Int, upper: Int, current_time: Int) -> Bool {
  current_time >= lower && current_time <= upper
}

/// Calculate withdrawn so far
pub fn calculate_withdrawn(total: Int, withdrawn: Int, current_time: Int, start: Int, end: Int) -> Int {
  if current_time < start {
    0
  } else if current_time >= end {
    total - withdrawn
  } else {
    let elapsed = current_time - start
    let duration = end - start
    let available = (total * elapsed) / duration
    available - withdrawn
      |> max(0)
  }
}

/// Extract ADA amount from a Value
pub fn ada_only(value: Value) -> Int {
  value.lovelace
}

/// Check if a transaction contains at least a minimum ADA amount sent to an address
pub fn sends_min_ada(tx: Transaction, min_ada: Int) -> Bool {
  tx.outputs
    |> list.any(fn(output) { output.value.lovelace >= min_ada })
}
