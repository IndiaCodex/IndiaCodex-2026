# ADR-005: CIP-57-First SDK Generation

## Context

Off-chain code needs typed access to a validator's datum/redeemer shapes.
Today, teams hand-write these types against Lucid/Mesh with no
compiler-enforced link back to the actual validator — the single largest
source of the "manual SDK creation" and "serialization errors" pain
points identified in `Vision.md`.

## Decision

Treat Aiken's CIP-57 blueprint (`plutus.json`) as the single source of
truth for a validator's interface, parsed into the domain `Blueprint` type
by `adapter-aiken`, and generate the TypeScript SDK (`adapter-codegen-ts`)
purely from that parsed blueprint — never from hand-maintained type
definitions.

## Alternatives Considered

- **Hand-written TS types, kept in sync by review discipline.** The
  ecosystem status quo, and exactly the failure mode this platform exists
  to remove.
- **A bespoke interface-description format invented by this project.**
  Would require Aiken to adopt it too, or a second parser to maintain —
  whereas CIP-57 is already emitted by the compiler for free.
- **Generate from compiled Plutus Core directly.** Technically possible,
  but discards the human-readable field names and structure CIP-57
  already provides, and isn't the ecosystem-standard interface layer.

## Consequences

SDK quality is bounded by blueprint quality — a validator with poorly
named fields produces a poorly named SDK, since generation is mechanical,
not creative. This is an accepted trade-off: mechanical, predictable
generation is exactly what was missing from this ecosystem.
