// MediChain AI — Medical Record NFT Minting Policy
// CIP-25 compliant NFT minting for tamper-proof medical records
// Only the authorized hospital wallet can mint
// Once minted, records are immutable on Cardano

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{Transaction}

// Only the hospital admin can mint Medical Record NFTs
// This prevents forging of medical records

validator medical_record_nft(
  // Hospital admin's verification key hash
  // This is set at deploy time — only this key can mint
  authorized_minter: VerificationKeyHash,
) {
  mint(_redeemer: Data, _policy_id: ByteArray, self: Transaction) {
    // Hospital admin must sign every minting transaction
    list.has(self.extra_signatories, authorized_minter)
  }

  else(_) {
    fail
  }
}
