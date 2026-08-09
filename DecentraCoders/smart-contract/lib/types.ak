pub type Datum {
  idea_id: ByteArray,
  idea_hash: ByteArray,
  owner_public_key_hash: ByteArray,
  submitted_at: Int,
  app_name: ByteArray,
  version: ByteArray,
}

pub type Redeemer {
  Spend
}
