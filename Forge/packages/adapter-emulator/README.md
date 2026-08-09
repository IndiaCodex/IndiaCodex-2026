# @forge/adapter-emulator

A lightweight, in-memory UTxO ledger — implements `IEmulatorPort`.

## What it does

`seed` populates the ledger from a list of wallets; `run` inspects the
actual seeded state (not a hardcoded result) and reports whether a
scenario has a spendable UTxO to exercise against.

## Known limitation

There is no transaction-building or Plutus execution engine here — that
requires a real off-chain tx builder plus a CEK-machine-level evaluator,
which doesn't exist yet in this platform. `run`'s check is therefore
generic (does spendable value exist), not a simulation of any specific
validator's redeemer logic. This is intentional, documented scope, not an
oversight — see `docs/DevelopmentProgress.md` (Phase 3 entry).
