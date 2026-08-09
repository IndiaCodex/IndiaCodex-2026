# 0009. The Dashboard Is a Client of the Public Query API, With No Private Access to the Core

## Status

Accepted

## Context

The Dashboard needs richer, more aggregate views than a single CLI query — release health, repository relationship maps, ecosystem risk analysis (see [roadmap.md](../roadmap.md), [interfaces.md](../architecture/interfaces.md#dashboard)). Because it's built by the same team as the core, it would be technically straightforward to give it a shortcut: direct access to `core/application`, or even to the storage layer, bypassing the [Query API](../architecture/api-contracts.md) that third-party consumers are expected to use.

That shortcut is attractive for exactly the reason it's dangerous: it's easy to reach for under time pressure, and once taken, it quietly creates two tiers of consumer — one with a fast path to richer data, and everyone else limited to what the public API happens to expose.

## Decision

The Dashboard is a client of the same public [Query API](../architecture/api-contracts.md) that any third-party integration would use. It has no direct dependency on `core/application`, `storage/`, or any plugin.

## Alternatives Considered

**A private, richer internal API for the Dashboard**, with the public API kept as a subset. Rejected because it removes the forcing function that keeps the public API complete: if the Dashboard can quietly reach around the public contract for anything it needs, gaps in that contract stop being visible or urgent to fix. Treating the Dashboard as just another consumer means any capability it needs has to become a real, documented API operation — which is a better outcome for every other consumer too.

**Direct database access for the Dashboard**, reading the Knowledge Graph's storage directly for performance. Rejected on the same grounds as [ADR 0003](0003-clean-architecture-with-enforced-dependency-rule.md): it couples the Dashboard to a specific storage implementation, which defeats the purpose of the storage port, and it means a storage migration ([ADR 0008](0008-simplest-storage-adapter-first.md)) would require changing the Dashboard alongside it rather than being invisible to every consumer above the port.

## Consequences

The Query API is guaranteed to be a complete, honest description of what Compass can tell any consumer — because the highest-usage first-party consumer depends on it having no gaps. This does mean Dashboard feature work sometimes requires landing a new API operation first, which is a real sequencing cost; it's accepted because the alternative — a public API that's perpetually behind what the Dashboard actually does — undermines the "one API, every consumer" principle this decision exists to protect (see [api-contracts.md](../architecture/api-contracts.md#principle-one-api-every-consumer)).
