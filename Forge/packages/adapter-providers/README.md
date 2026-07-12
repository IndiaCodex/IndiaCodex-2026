# @forge/adapter-providers

Real CIP-19 address computation, a local deployment-manifest store, and a
stub transaction builder — implements `IChainProviderPort`,
`IDeploymentStorePort`, and `ITxBuilderPort`.

## What's real

- `ChainProviderAdapter.computeScriptAddress` computes a genuine bech32
  Cardano address (CIP-19 enterprise script address — correct address-type
  nibble and network tag) from a validator's script hash. Verified by a
  round-trip encode/decode test, not just "looks right."
- `LocalDeploymentStore` writes a real, versioned JSON deployment manifest
  under `<project>/deployments/<network>/` — meant to be committed and
  reviewed like any other code change.

## What's a stub

`NotImplementedTxBuilder` exists only so `DeployUseCase` has something to
construct with. No real off-chain transaction-building pipeline exists
yet, and the escrow-milestone template needs no setup transaction, so this
is never actually invoked today. It fails loudly (rejects) rather than
pretending to submit anything, if it ever is.
