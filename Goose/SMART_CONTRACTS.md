# Smart Contracts — uniperp (Team Goose)

On-chain code spans **two chains**: Aiken (Plutus V3) validators on **Cardano**, and Compact zero-knowledge circuits on **Midnight**.

## Cardano — Aiken (Plutus V3)

Source: [`packages/contracts-aiken/`](./packages/contracts-aiken) · compiled blueprint: `dorr-vault/plutus.json`

| Contract | File | What it enforces |
|---|---|---|
| **Non-custodial vault** ⭐ | [`packages/contracts-aiken/dorr-vault/validators/owner_vault.ak`](./packages/contracts-aiken/dorr-vault/validators/owner_vault.ak) | A deposit can be spent **only by the depositor** (the `owner` pkh in its datum). The operator can never move, seize, or block user funds. **Live-proven on preprod:** the operator's withdrawal attempt is rejected on-chain; the user reclaims with their own key. |
| Operator margin vault | [`packages/contracts-aiken/dorr-vault/validators/margin_vault.ak`](./packages/contracts-aiken/dorr-vault/validators/margin_vault.ak) | v1 operator-managed margin custody (parameterized by the operator key). |
| Settlement anchor | [`packages/contracts-aiken/settlement-anchor/validators/settlement_anchor.ak`](./packages/contracts-aiken/settlement-anchor/validators/settlement_anchor.ak) | Stores a settlement / sealed-batch-membership digest on L1 (inline datum) as a public, immutable audit trail. |
| dUSD policy | native sig-policy (operator key) | Mints the demo dUSD margin token. |

The non-custodial `owner_vault` validator, in full:

```aiken
validator owner_vault {
  spend(datum: Option<OwnerDatum>, _r: Data, _utxo: OutputReference, self: Transaction) {
    expect Some(OwnerDatum { owner }) = datum
    list.has(self.extra_signatories, owner)   // ONLY the owner can move it
  }
  else(_) { fail }
}
```

**Build:** `cd packages/contracts-aiken/dorr-vault && aiken build` → `plutus.json`.

## Midnight — Compact (zero-knowledge)

Source: [`vendor/zkperps/contract/src/*.compact`](./vendor/zkperps/contract/src) · drivers: `vendor/zkperps/midnight-local-cli/src/dorr-*.ts`

| Circuit | Proves |
|---|---|
| `zkperps-order.compact` | trader-order authority over a commitment; binds the L1 settlement anchor |
| `zkperps-matching.compact` | a match record opens the two committed order legs |
| `zkperps-settlement.compact` | a settlement state transition (rolling digest) |
| `zkperps-liquidation.compact` | a margin-breach opening |
| `zkperps-aggregate.compact` | a Merkle aggregation of child proof digests |

**Build:** `cd vendor/zkperps/contract && npm install && npm run compact && npm run build`.

## Off-chain privacy primitive — drand timelock (not a chain contract, but core)

Client-side order sealing uses **`tlock-js`** (IBE over BLS12-381) against the **drand League of Entropy** quicknet, so the operator receives only ciphertext until the batch's round beacon is published. See [`services/operator/src/sealbid.ts`](./services/operator/src/sealbid.ts) and [`apps/web/lib/seal.ts`](./apps/web/lib/seal.ts).

---

Full threat model + honest scope (what's enforced vs trusted): [`docs/SECURITY.md`](./docs/SECURITY.md).
