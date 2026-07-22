# Problem Statement

## Summary

Midnight is an ecosystem, not a single product: a protocol, a compiler (Compact), a set of SDKs, a node, a wallet, reference templates, examples, documentation, and a growing set of third-party applications and libraries built against all of it. Each of these components is versioned and released independently. None of them declares, in a form another tool can consume, which versions of the others it is compatible with. Compatibility is discovered empirically, by engineers, one broken build at a time.

This document describes that gap in concrete terms: where it comes from, why it gets worse as the ecosystem grows, why manual mitigation does not scale, and why comparable ecosystems have all eventually built dedicated tooling to solve it.

## Where the Gap Comes From

An application built on Midnight sits at the intersection of several independently moving parts:

- the **protocol version** the target network (devnet, testnet, mainnet) is running
- the **compiler version** used to build Compact contracts
- the **SDK version(s)** used to interact with the node and construct transactions
- the **node/runtime version** the application talks to
- the **wallet API version** the application integrates against
- the **proof server version** used for proof generation

Each of these is released on its own schedule by teams making locally reasonable decisions with no shared, machine-readable record of what they assume about the others. A change in the compiler's output format, a renamed SDK method, a modified protocol message shape — any of these can silently break every downstream component that depends on the old behavior, and none of them is currently required to declare that it did so in a form other tooling can check.

This is a structural property of growing ecosystems, not a quality problem with any individual Midnight component. It appears precisely because each team is doing its job correctly in isolation.

## Why This Gets Worse, Not Better, Over Time

The number of pairwise compatibility relationships in an ecosystem grows combinatorially with the number of components and releases, while the human capacity to track them by memory grows linearly at best. A protocol with three components and two releases each is a handful of combinations a core team can hold in their heads. The same protocol with ten components — which is roughly where Midnight already is once templates, wallet, node, compiler, and multiple SDK packages are counted separately — each with a dozen historical releases, is a matrix no individual can track, and no team currently owns.

Early in an ecosystem's life this is invisible, because there is one canonical "current" version of everything and most developers stay on it. It becomes visible exactly at the inflection point Midnight is now entering: multiple SDK versions in active use, multiple deployed environments (devnet/testnet/mainnet) potentially on different protocol versions, a growing number of downstream applications each pinned to whatever combination happened to work when they were built, and template/example repositories that were correct at publication and silently drift out of sync with every release after.

## Symptoms Today

These are the concrete, recurring failure modes this gap produces, all of which are currently absorbed by individual engineers rather than caught by tooling:

- **Incompatible versions** — an application pins an SDK version and a node version that were never tested together
- **Dependency drift** — a project's pinned versions slowly diverge from what the ecosystem currently supports, discovered only at upgrade time, when the gap has become large
- **SDK/runtime mismatch** — code that compiles and passes local tests but fails against a live network running a different protocol version
- **Broken examples** — official templates and tutorials that were correct at time of writing and are now silently wrong, actively misleading new developers evaluating Midnight
- **Migration complexity** — no authoritative list of what changed between two versions and what a consuming application must do about it
- **Release coordination overhead** — every cross-component release becomes an informal, manual coordination exercise between maintainers
- **Environment reproducibility failures** — "works on my machine" caused by an untracked combination of local tool versions
- **Undetected CI risk** — a pull request can merge cleanly, pass its own tests, and still introduce ecosystem-level incompatibility that only surfaces downstream

None of these are exotic. They are the everyday cost of coordinating a multi-component ecosystem without a shared compatibility model, and today that cost is paid entirely by individual engineers re-deriving information that should be a lookup.

## Why Manual Approaches Fail

The current state of the art for compatibility knowledge in fast-moving ecosystems — including Midnight's today — is: changelogs, release notes, pinned versions arrived at by trial and error, and tribal knowledge held by whoever has been on the core team longest. This fails for structural reasons, not effort reasons:

- **It is not queryable.** A changelog answers "what changed in this release," not "will version A of this work with version B of that." Answering the second question requires a human to read several changelogs and reason about their intersection, every time.
- **It is not enforceable.** Nothing stops a pull request from introducing an incompatibility, because there is no machine-checkable representation of compatibility for CI to evaluate against.
- **It decays faster than it can be maintained.** Documentation of compatibility is accurate at the moment it's written and stale by the next release. Nobody's job is to keep it current, so it isn't.
- **It does not transfer.** Tribal knowledge lives in specific people. It does not show up in search, it is not the same answer twice, and it disappears when that person is unavailable or moves on.
- **It concentrates cost on the least-informed.** The people most damaged by this gap are new teams evaluating or adopting Midnight — exactly the population an ecosystem most needs to make successful, and exactly the population with the least access to tribal knowledge.

## This Is Not a Novel Problem — and Not One That Stays Unsolved

Every ecosystem that grows past a small, tightly coupled core eventually confronts this and eventually builds dedicated tooling for it, because manual coordination stops scaling at a predictable point. Kubernetes formalized a version-skew policy and tooling to enforce it once its component count and release cadence outgrew informal coordination. Terraform's provider ecosystem required an explicit compatibility protocol once providers were released independently of core. Rust's ecosystem tracks and enforces minimum-supported-Rust-version compatibility because crates broke silently against toolchain updates often enough that leaving it to changelogs was untenable. Android's build tooling enforces compiler/Gradle/API-level compatibility directly in the build because the alternative — a developer discovering incompatibility at build time by trial and error — does not scale to the size of that ecosystem.

The pattern is consistent: ecosystems either build compatibility tooling proactively, while the component count is still small enough to make the initial model tractable, or they build it reactively, after enough teams have been burned that it becomes unavoidable — at which point the matrix to model is much larger and the trust already lost is harder to rebuild. Midnight is currently in the window where the proactive path is still available and comparatively cheap.

## Cost of Inaction

For Midnight specifically, the cost of leaving this gap unaddressed is not evenly distributed:

- **Core team cost**: recurring, individually-answered support burden for questions that are really the same question ("what works with what") asked by different people
- **Developer cost**: time lost to empirical discovery of incompatibility, repeated independently by every team that hits it
- **Adoption cost**: enterprise evaluators treat "how do you manage upgrade risk" as a standard due-diligence question; an ecosystem with no answer beyond "we haven't had major problems yet" carries adoption friction that compounds as Midnight seeks production, regulated-industry use
- **Reputation cost**: broken examples and undiscovered incompatibility are a new developer's first impression of ecosystem maturity, and first impressions in developer tooling are expensive to undo

None of these costs require anything to go dramatically wrong to accrue — they accrue continuously, as a tax on every team building on Midnight, whether or not any single incident is severe enough to be visible to leadership.

## What This Document Does Not Claim

This is not a claim that Midnight's components are poorly engineered, or that any team is at fault. It is a claim that *no team currently owns the space between components*, and that this space grows in importance every time a new SDK version, protocol upgrade, or downstream application ships. See [vision.md](vision.md) for what an owned version of that space looks like.
