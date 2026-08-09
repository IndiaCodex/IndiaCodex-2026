# 0008. The First Storage Adapter Is the Simplest Implementation That Satisfies the Port

## Status

Accepted

## Context

`core/application` depends on a `SnapshotRepository` port, not a concrete storage technology (see [knowledge-graph.md](../architecture/knowledge-graph.md#storage-abstraction)). That abstraction makes it tempting to justify building a sophisticated first implementation — a distributed database, a purpose-built graph store — on the theory that the abstraction exists precisely to support something that scalable eventually, so it might as well be built that way from the start.

Compass's own stated v1 performance assumptions (see [cross-cutting-concerns.md](../architecture/cross-cutting-concerns.md#performance-assumptions)) describe an ecosystem of tens of components and hundreds of releases each — a dataset that fits comfortably in memory and on local disk. Building distributed storage infrastructure for that scale, before real usage has demonstrated a need for more, is the specific kind of complexity this project's design principles ([vision.md](../vision.md)) commit to resisting.

## Decision

The first concrete `SnapshotRepository` adapter is the simplest implementation that correctly satisfies the port — at v1 scale, a local, file-based or embedded-database snapshot store, not a hosted or distributed backend. A more scalable adapter is built when a real, demonstrated need exists: the hosted [Dashboard](../architecture/interfaces.md#dashboard) going live, or multi-tenant enterprise scale (see [roadmap.md](../roadmap.md), [business-case.md](../business-case.md)) — not preemptively.

## Alternatives Considered

**Building a scalable/distributed storage backend from the start**, on the theory that it will eventually be needed. Rejected as premature optimization against requirements that don't exist yet: it adds real operational and implementation complexity (deployment, backup, a database dependency for every contributor running Compass locally) in exchange for headroom the stated v1 scale doesn't require. It would also make Compass harder to run and contribute to locally, working against the "suitable for open-source contributors" objective this architecture is held to.

**No storage abstraction at all — code directly against whatever the first storage choice is**, deferring the port itself until a second backend is actually needed. Rejected separately from the adapter question: the *port* is cheap to introduce now and is what makes swapping the simple adapter for a scalable one later a new module rather than a rewrite of `core/application` (see [ADR 0003](0003-clean-architecture-with-enforced-dependency-rule.md)). This ADR is about the adapter's complexity, not the abstraction's existence — the abstraction is justified on its own terms regardless of how simple the first implementation behind it is.

## Consequences

v1 is easy to run — clone, install, no external database to stand up — which matters directly for open-source contributor experience. When real scale or hosted-dashboard requirements arrive, the fix is a new adapter behind the existing port, not a redesign. The explicit trigger conditions above exist so this decision gets revisited deliberately, on evidence, rather than either prematurely over-built now or left too simple past the point it should have changed.
