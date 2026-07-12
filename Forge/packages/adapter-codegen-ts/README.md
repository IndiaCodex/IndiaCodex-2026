# @forge/adapter-codegen-ts

Generates a typed TypeScript SDK from a CIP-57 blueprint — implements
`ISdkGeneratorPort`.

## What it does

For every Aiken `pub type` referenced by a validator's datum or redeemer,
emits a named TypeScript declaration: an `interface` for a
single-constructor record, or a tagged-union `type` alias for a
multi-constructor enum — resolving `$ref`/`anyOf` recursively against the
blueprint's `definitions`. Each validator also gets a typed `Datum`/
`Redeemer` alias and a metadata constant (title, hash, compiled code).

Generation is mechanical, not creative — see
[docs/adr/ADR-005-cip57-first-sdk-generation.md](../../docs/adr/ADR-005-cip57-first-sdk-generation.md).

## Known limitation

Aiken's `Int` maps to TypeScript `number`, not `bigint` — a reasonable
simplification for now, since Plutus integers are arbitrary-precision and
`number` isn't, in general. Revisit if a template needs values large
enough for this to matter.
