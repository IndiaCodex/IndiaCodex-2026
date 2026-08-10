# on-chain — Aiken batch settlement validator

The `batch_settlement` validator authorizes one settlement transaction that claims a whole batch of
ticket UTXOs. Spec: [`../Docs/onchain-spec.md`](../Docs/onchain-spec.md). Rules (trimmed to 4 for the
hackathon): input `Open` · claimant signed · no duplicate `utxo_ref` · **state stays split**.

## Layout
```
on-chain/
├── aiken.toml
├── lib/batcher/types.ak        # BatchDatum, Status, ClaimEntry, BatchRedeemer
└── validators/batch_settlement.ak  # the validator + helper tests
```

## Build & test
```bash
# If starting fresh, prefer scaffolding so deps/version pin correctly, then drop in lib/ + validators/:
#   aiken new batcher/adaptive
aiken check     # runs tests on the real VM; reports CPU/mem (the batch-size benchmark)
aiken build     # emits plutus.json (CIP-0057 blueprint): compiled validator + hash + schema
```

- The validator **hash** in `plutus.json` derives the **script address** (no separate deploy tx).
- Seed tickets + get the script address via `demo-app/scripts/seed.ts` (`npm run seed`).
- ⚠️ Verify stdlib module/constructor names (`InlineDatum`, `extra_signatories`, `OutputReference`
  fields) against your pinned Aiken/stdlib version — they shift between releases.

## Batch-size benchmark → `N_max`
Add a parameterized test settling `k = 1,2,4,8,16,24` claims; read CPU/mem from `aiken check`. The
largest `k` under `maxTxExUnits` is `N_max` → set `demo-app/lib/agent/config.ts` `batchCap = N_max`
and put the number on the fee slide. See [`../Docs/onchain-spec.md`](../Docs/onchain-spec.md) §6.
