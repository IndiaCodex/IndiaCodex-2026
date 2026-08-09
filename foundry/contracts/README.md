# Foundry Smart Contracts (Aiken)

This folder contains the **on-chain smart contract codebase** for Foundry, separate from the Next.js application.

## Validators

| File | Validator | Purpose |
|------|-----------|---------|
| `validators/main.ak` | `main` | Owner-signed spending validator for administration and payment forwarding |
| `validators/lock.ak` | `lock` | Timelock — lock ADA until deadline; owner or beneficiaries can unlock |
| `validators/mint.ak` | `mint` | Minting policy — owner-signed mint; open burn |
| `validators/vesting.ak` | `vesting` | Linear vesting with cliff and withdrawal schedule |

## Shared library

- `lib/foundry/types.ak` — datums and action types (`LockDatum`, `VestingDatum`, `MintAction`, etc.)
- `lib/foundry/utils.ak` — helpers (`is_signed_by`, `deadline_passed`, `calculate_withdrawn`)

## Tests

- `tests/main_test.ak`
- `tests/lock_test.ak`
- `tests/mint_test.ak`
- `tests/vesting_test.ak`

## Build & verify

```bash
cd contracts
aiken check
aiken build
```

Compiled artifacts are written to `contracts/build/` (Plutus JSON).

## Deploy scripts

- `scripts/setup_testnet.sh` — generate keys for Preprod
- `scripts/deploy.sh` — build deployment transaction from compiled `plutus.json`

## Network contexts

Configured in `aiken.toml` for **preprod** and **mainnet**.