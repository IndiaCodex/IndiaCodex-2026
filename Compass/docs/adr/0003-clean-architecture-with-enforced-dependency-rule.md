# 0003. Clean Architecture with an Enforced, CI-Checked Dependency Rule

## Status

Accepted

## Context

Compass's core promise — that a compatibility answer is reproducible and traceable regardless of where the underlying data came from or how the answer gets delivered — only holds if the logic that computes answers is genuinely independent of data sources and delivery surfaces. It is easy to *state* that independence and easy to lose it in practice: a storage detail leaks into a use case because it was convenient at the time, a delivery surface starts special-casing a plugin's data shape, and within a year the boundary exists only in documentation, not in the code.

Documentation alone has a poor track record of holding architectural boundaries under deadline pressure, especially in an open-source project accepting contributions from people who haven't internalized the boundary's rationale.

## Decision

Compass is structured as Clean/Hexagonal Architecture with a single enforced dependency rule: dependencies point inward, toward `core/domain`, never outward (see [repository-structure.md](../architecture/repository-structure.md)). `core/domain` depends on nothing. `core/application` depends only on `core/domain` and defines ports for everything it needs from outside. Plugins, storage adapters, and interfaces all depend on the core through those ports; the core never depends on any of them.

This is not left to code review discretion. A dependency-direction lint runs in CI as a required check, on every pull request, failing the build on any import that violates the graph — the same enforcement mechanism used for tests.

## Alternatives Considered

**A conventional layered structure without automated enforcement**, relying on code review and documentation to hold the boundary. Rejected because the whole point of the boundary is to survive exactly the moments review is most likely to miss it — a deadline-driven shortcut, a well-intentioned contributor unfamiliar with the rationale. An unenforced rule is a suggestion, and this rule is load-bearing for the trust model the entire product depends on.

**A simpler, more tightly coupled structure** (e.g., ingestion logic and compatibility logic in the same module, delivery surfaces calling storage directly) for faster initial development. Rejected because the cost of this coupling doesn't show up until the second plugin or the second delivery surface is added — at which point untangling it is a rewrite, not a refactor. Given that supporting additional ecosystems and additional delivery surfaces is the architecture's central bet (see [ADR 0001](0001-independent-compatibility-domain-model.md)), paying this cost once, up front, is cheaper than paying it later under the pressure of an actual second consumer waiting on it.

## Consequences

Every layer can be tested in isolation, using fakes for whatever it depends on through a port — see [cross-cutting-concerns.md](../architecture/cross-cutting-concerns.md#testing-strategy). Adding a plugin, a storage backend, or a delivery surface never requires touching `core/`. The cost is real and worth naming: contributors must learn and respect the boundary, and a genuinely cross-cutting change (a new domain concept several layers need) takes more deliberate design than it would in a less structured codebase. That cost is accepted because the alternative — a boundary that erodes silently — is worse for a project whose value depends on the core staying provably independent of any one ecosystem or delivery surface.
