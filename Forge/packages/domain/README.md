# @forge/domain

Pure domain entities and value types for the Forge platform — zero runtime
dependencies, zero I/O.

## What's here

Entities: `Project`, `Network`, `Blueprint` (a CIP-57-shaped model),
`DeploymentManifest`, `TestResult`/`TestReport`, `Wallet`/`Utxo`,
`ContractIntent`, `ContractTemplate`, `ContractParameters`,
`GeneratedContract`, `Rationale`, `Explanation`, `ReviewReport`,
`DocumentationArtifact`, `ResolvedForgeConfig`.

Three factories carry real validation/aggregation logic rather than just
shape: `createContractIntent`, `createRationale`, `summarizeTestResults`.

## Why it has no dependencies

Every other package in the platform depends on `domain`, directly or
transitively — keeping it dependency-free is what makes it safe to import
from anywhere (an adapter, a use case, a plugin) without ever creating a
cycle.

See [docs/Architecture.md](../../docs/Architecture.md) for how this fits
into the platform's Clean Architecture layering, and
[docs/adr/ADR-001-clean-architecture.md](../../docs/adr/ADR-001-clean-architecture.md)
for why.
