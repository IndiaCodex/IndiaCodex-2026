# ADR-002: Plugin Architecture

## Context

Forge needs to be extensible — new chain providers, new AI backends, new
generators — without forking the core, and the team needs confidence that
the extension API is actually sufficient, not just theoretical.

## Decision

Define one plugin contract (`ForgePlugin` + `PluginContext` with
`bindPort`/`onHook`/`registerCommand`/`registerGenerator`) and load every
capability — built-in adapters included — through the identical mechanism
via `plugin-loader`'s dependency-ordered `loadPlugins`. There is no
privileged "core-only" registration path.

## Alternatives Considered

- **Hard-wire built-ins, offer a looser API to third parties.** Simpler
  at first, but risks the built-in path silently diverging from what
  third parties can actually achieve.
- **Class-based inheritance/override extension.** Familiar to some, but
  couples plugins to concrete base classes instead of interfaces,
  weakening the ports-and-adapters boundary.
- **Dynamic npm-package auto-discovery (`forge-plugin-*`) inside the
  loader itself.** Valuable eventually, but package discovery is an
  outer-layer (CLI/config) concern — deferred rather than baked into the
  loader's core responsibility.

## Consequences

Dogfooding the plugin API for built-ins (mirroring Hardhat's design) keeps
the API honest — if a built-in ever needed something the API couldn't do,
that would surface immediately. Dynamic npm discovery and a curated
plugin registry remain roadmap items, not yet implemented.
