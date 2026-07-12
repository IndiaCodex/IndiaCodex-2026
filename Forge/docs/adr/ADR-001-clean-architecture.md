# ADR-001: Clean Architecture

## Context

Forge is meant to outlive the hackathon and support multiple presentation
layers (CLI today; an IDE extension or web playground later) and multiple
swappable Cardano-specific tools (Aiken, chain providers, an AI backend).
Business logic needs to be testable without any of those real tools
installed.

## Decision

Adopt Clean Architecture with four layers — **domain** (pure entities, zero
dependencies), **application** (use cases, port interfaces, the plugin/hook
registry), **interface adapters** (concrete port implementations), and
**frameworks & drivers** (CLI, future UIs). Dependencies point inward only,
enforced by package boundaries and TypeScript project references.

## Alternatives Considered

- **A single flat package.** Fastest to hack together, but couples
  business logic directly to Aiken/Lucid specifics and makes testing
  without real tools impossible.
- **Simple layered split with no explicit ports.** Less ceremony, but
  gives plugins no clean seam to bind alternate implementations against.
- **Full hexagonal with a separate package per port.** More granular than
  this scale justifies right now — adds package count without
  proportional benefit.

## Consequences

Every new capability requires a port plus at least one adapter — more
upfront ceremony than a script. In exchange, all of Phase 2's 53 tests run
against fakes with zero real Cardano tooling installed, and Phase 3 can
add real adapters without touching any Phase 2 code.
