use cardano/transaction.{Transaction, OutputReference, placeholder}
use types.{Datum, Spend}
use idea_proof_registry

const mock_owner_pkh: ByteArray =
  #"0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c"

const mock_valid_hash: ByteArray =
  #"1111111111111111111111111111111111111111111111111111111111111111"

const mock_invalid_hash: ByteArray =
  #"2222"

test test_spend_valid_owner_signature() {
  let datum =
    Datum {
      idea_id: "idea-123",
      idea_hash: mock_valid_hash,
      owner_public_key_hash: mock_owner_pkh,
      submitted_at: 1718192000,
      app_name: "LaunchNest",
      version: "1.0",
    }

  let tx =
    Transaction { ..placeholder, extra_signatories: [mock_owner_pkh] }

  let output_ref =
    OutputReference { transaction_id: #"00", output_index: 0 }

  idea_proof_registry.idea_proof_registry.spend(
    Some(datum),
    Spend,
    output_ref,
    tx,
  )
}

test test_spend_invalid_owner_signature() {
  let datum =
    Datum {
      idea_id: "idea-123",
      idea_hash: mock_valid_hash,
      owner_public_key_hash: mock_owner_pkh,
      submitted_at: 1718192000,
      app_name: "LaunchNest",
      version: "1.0",
    }

  let wrong_pkh: ByteArray =
    #"99999999999999999999999999999999999999999999999999999999"

  let tx =
    Transaction { ..placeholder, extra_signatories: [wrong_pkh] }

  let output_ref =
    OutputReference { transaction_id: #"00", output_index: 0 }

  !idea_proof_registry.idea_proof_registry.spend(
    Some(datum),
    Spend,
    output_ref,
    tx,
  )
}

test test_spend_invalid_idea_hash() {
  let datum =
    Datum {
      idea_id: "idea-123",
      idea_hash: mock_invalid_hash,
      owner_public_key_hash: mock_owner_pkh,
      submitted_at: 1718192000,
      app_name: "LaunchNest",
      version: "1.0",
    }

  let tx =
    Transaction { ..placeholder, extra_signatories: [mock_owner_pkh] }

  let output_ref =
    OutputReference { transaction_id: #"00", output_index: 0 }

  !idea_proof_registry.idea_proof_registry.spend(
    Some(datum),
    Spend,
    output_ref,
    tx,
  )
}

test test_spend_missing_idea_hash() {
  let datum =
    Datum {
      idea_id: "idea-123",
      idea_hash: #"",
      owner_public_key_hash: mock_owner_pkh,
      submitted_at: 1718192000,
      app_name: "LaunchNest",
      version: "1.0",
    }

  let tx =
    Transaction { ..placeholder, extra_signatories: [mock_owner_pkh] }

  let output_ref =
    OutputReference { transaction_id: #"00", output_index: 0 }

  !idea_proof_registry.idea_proof_registry.spend(
    Some(datum),
    Spend,
    output_ref,
    tx,
  )
}
