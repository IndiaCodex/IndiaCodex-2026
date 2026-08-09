//// block_ledger — the on-chain guard for Hydra Minecraft's world log.
////
//// Each block-action record lives at this script address as a UTxO with a
//// `BlockAction` inline datum. Records form an APPEND-ONLY ledger: the world
//// is rebuilt by replaying them, so a record must never be silently mutated.
////
//// The head's operating authority (the relay's key — the same server-side
//// Ed25519 key in `server/setup.js`) is the only party allowed to spend a
//// record, and only to consolidate/garbage-collect fuel, never to rewrite
//// history. A spend is therefore valid only when:
////   1. the record datum is well-formed (in-range block id + known action), and
////   2. the transaction is signed by the configured `authority`.
////
//// In the running demo the head runs in offline mode with zero-fee protocol
//// parameters, so records accumulate as inline datums and are never spent —
//// this validator formalises the rules the off-chain relay already enforces
//// and makes them portable to a real (L1-settled) Hydra head.

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction}
use hydra_minecraft/types.{BlockAction, is_well_formed}

/// Redeemer for spending a record UTxO.
pub type LedgerAction {
  /// authority reclaims/consolidates a record's lovelace (append-only upkeep)
  Consolidate
}

validator block_ledger(authority: VerificationKeyHash) {
  spend(
    datum: Option<BlockAction>,
    _redeemer: LedgerAction,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(record) = datum
    and {
      // the record we are spending must itself be a valid world edit
      is_well_formed(record),
      // only the head authority may ever move a record
      list.has(self.extra_signatories, authority),
    }
  }

  // no minting / withdrawal / publish purposes for this script
  else(_ctx) {
    fail
  }
}

// ---------------------------------------------------------------------------
// Tests (run with `aiken check`)
// ---------------------------------------------------------------------------

fn mk(block_type_id: Int, action: Int) -> BlockAction {
  BlockAction { x: 7, y: 27, z: 5, block_type_id, action, seq: 42 }
}

fn tx_signed_by(keys: List<VerificationKeyHash>) -> Transaction {
  Transaction { ..transaction.placeholder, extra_signatories: keys }
}

test authority_can_consolidate_well_formed_record() {
  let auth = #"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8"
  let record = mk(7, 0)
  // brick, place
  block_ledger.spend(
    auth,
    Some(record),
    Consolidate,
    mock_ref(),
    tx_signed_by([auth]),
  )
}

test rejects_unsigned_spend() fail {
  let auth = #"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8"
  let record = mk(13, 1)
  // diamond, break
  block_ledger.spend(auth, Some(record), Consolidate, mock_ref(), tx_signed_by([]))
}

test rejects_out_of_range_block_id() fail {
  let auth = #"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8"
  let record = mk(99, 0)
  // invalid block id
  block_ledger.spend(
    auth,
    Some(record),
    Consolidate,
    mock_ref(),
    tx_signed_by([auth]),
  )
}

fn mock_ref() -> OutputReference {
  OutputReference {
    transaction_id: #"0000000000000000000000000000000000000000000000000000000000000000",
    output_index: 0,
  }
}
