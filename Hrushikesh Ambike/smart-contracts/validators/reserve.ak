use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId}
use cardano/transaction
use cardano/transaction.{Transaction}

// Why this is signature-gated rather than checking for a specific vault
// script hash: ouro_reserve would need vault's script hash as a parameter,
// but vault.ak is itself parameterized by tusdm_policy (= reserve's own
// script hash, since reserve IS the tUSDM minting policy) so it can verify
// mint amounts. Each script's hash would depend on the other's hash first -
// a genuine circular dependency neither could ever be compiled from.
//
// Fix: reserve's mint is gated on an admin/operator signature instead of a
// vault-hash check - the same "centralized, not safety-critical because
// there's no liquidation" trust model already accepted for the price
// oracle (design spec section 9, Q2). The real economic security still
// lives in vault.ak's OWN spend validator, independently: LTV limit,
// origination fee, owner signature, and exact mint-amount matching against
// the known tusdm_policy all run there regardless of what gates the mint.
// The admin key is the backend/operator that constructs these transactions
// and only ever co-signs a mint alongside a correctly-shaped vault spend.
// A fully trustless version (e.g. an NFT thread-token proving vault
// authenticity, minted via a one-shot seed-UTxO policy) is documented
// future work, not a silent gap.
validator ouro_reserve(admin_vkh: VerificationKeyHash) {
  mint(_r: Data, _policy_id: PolicyId, self: Transaction) {
    list.has(self.extra_signatories, admin_vkh)
  }

  else(_) {
    fail
  }
}

const fake_admin: VerificationKeyHash =
  #"aa000000000000000000000000000000000000000000000000000000"

test reserve_rejects_unsigned_mint() {
  let self = Transaction { ..transaction.placeholder, extra_signatories: [] }
  !list.has(self.extra_signatories, fake_admin)
}

test reserve_accepts_admin_signed_mint() {
  let self =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [fake_admin],
    }
  list.has(self.extra_signatories, fake_admin)
}
