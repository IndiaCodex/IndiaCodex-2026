# Vision

## North Star

Midnight Compass exists so that no engineer building on Midnight has to discover incompatibility by having it break in front of them. Every question in the [problem statement](problem-statement.md) — can I upgrade, what works with what, what will this break — should have a fast, authoritative, machine-checkable answer instead of a guess backed by trial and error.

We think of Compass as **the engineering navigation system for the Midnight ecosystem**: it does not build anything for you, it tells you where you are, what's around you, and whether the path you're about to take is safe.

## What Success Looks Like

Success is not Compass being widely known. Success is Compass being invisible in the way good infrastructure is invisible — present in every relevant workflow, rarely thought about, deeply relied upon.

Concretely, three years in, success looks like:

- **A pull request that introduces ecosystem incompatibility fails CI, automatically, on every actively maintained Midnight repository** — not because a human remembered to check, but because the check is a standard part of the pipeline, the same way a linter or a test suite is.
- **"What's compatible with what" is answered by a query, not a person.** New contributors and ten-year veterans of the ecosystem get the same answer, from the same source, in seconds.
- **The Midnight core team recommends Compass to every new integrator during onboarding**, not because they are asked to, but because it demonstrably reduces the volume of "why doesn't this work" questions they'd otherwise field individually.
- **Enterprise adoption reviews cite Compass as evidence of upgrade-risk management**, the same way they'd cite a dependency-scanning tool or an SBOM process — a standard, expected piece of production-readiness infrastructure, not a novelty.
- **Templates and examples stop going silently stale**, because staleness is now a detectable, alertable condition rather than something a user discovers by trying the example and having it fail.

If, three years from now, compatibility questions are still primarily being resolved in chat channels, Compass has not succeeded regardless of how much code exists.

## Why Compass Stays Narrowly Focused

Discipline about scope is itself part of the vision, not a constraint on it. Compass's value depends on staying a narrow, trusted source of truth for one specific question — whether declared components are compatible — so growth is deliberately concentrated on depth within compatibility intelligence rather than breadth into adjacent engineering problems.

- **Compatibility, not resolution.** Compass tells you whether a chosen set of versions is known to work together. Choosing and installing those versions stays the job of the package managers engineers already use, so Compass can stay focused on the judgment call those tools don't make.
- **A signal, not a pipeline.** Compass produces a compatibility signal — through a GitHub Action and machine-readable output — that CI systems consume. It plugs into the pipelines engineers already run rather than asking them to adopt a new orchestration layer.
- **Declared relationships, not source semantics.** Compass reasons about compatibility relationships between released components — version constraints, declared dependencies, observed CI results — keeping its scope aligned with what a release actually promises rather than what its implementation happens to do internally.
- **Rules, not predictions.** Every answer Compass gives is reproducible from its underlying data and rules: the same question, asked twice against the same ecosystem state, gives the same answer, traceable to the specific rule and data behind it. That's what lets an engineer or a CI pipeline act on it directly, rather than treating it as one more signal to independently verify.
- **A sharper target for testing, not a substitute for it.** Compass narrows the space of what's worth testing by ruling out known-incompatible combinations up front, making the integration testing teams already do more targeted.

## Guiding Principles

These principles govern every design and prioritization decision going forward, and every proposed capability should be checked against them before it is accepted.

**Production-first.** Compass is built to be depended upon, not to demo well. A capability that looks impressive but produces a false negative in CI is worse than not shipping it.

**Enterprise-first.** The ecosystem's growth depends disproportionately on organizations that need a defensible, auditable answer to "how do you manage upgrade risk." Compass's design should satisfy that bar by default, not as a later add-on.

**Open-source quality.** Compass is infrastructure other people's production systems will depend on. It is held to the standard of software other projects vendor and trust, not the standard of an internal tool.

**Composable, plugin-architected.** New ecosystem sources (a new SDK, a new registry, a new component type) must be addable without modifying Compass's core. The domain model — components, releases, compatibility relationships — is stable; the sources that feed it are not, and should be swappable.

**Clean Architecture, framework independent.** The rules that define what "compatible" means must not depend on how data is ingested or how results are delivered. This is what allows Compass to add a new delivery surface (a dashboard, an API, a new CI integration) without touching the logic that makes its answers correct.

**Everything testable, everything deterministic.** Given the same ecosystem state and the same rules, Compass must produce the same answer, every time, and that answer must be traceable to the specific data and rule that produced it. No magic, no hidden behavior, no unnecessary abstraction — every layer exists because it earns its place, not because it is conventional.

## Why This Matters to Midnight Specifically

Midnight's differentiated value proposition is bringing privacy-preserving smart contracts to production and enterprise use. Enterprises evaluating production blockchain infrastructure apply the same due-diligence lens they apply to any other production dependency: what happens when we need to upgrade, how do we know it's safe, what's our rollback story. An ecosystem that cannot answer those questions with tooling — only with reassurance — carries adoption friction that works directly against Midnight's stated audience.

Compass is not a feature request from the developer community. It is infrastructure the ecosystem needs in order to credibly make the enterprise-readiness claim Midnight is already making elsewhere.

## Long-Term Shape

Compass starts as a compatibility intelligence engine with two consumer-facing surfaces: a CLI and a GitHub Action. Every subsequent capability — dashboards, hosted views, richer risk analysis — is a new way of presenting the same underlying, deterministic compatibility graph, not a new source of truth. The roadmap ([roadmap.md](roadmap.md)) sequences that expansion; this document is the constraint that expansion has to satisfy at every step.
