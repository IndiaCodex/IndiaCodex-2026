# Roadmap

## Sequencing Principle

Every phase below exists to prove or extend one thing: that the compatibility graph in the [domain core](architecture-overview.md) is correct and trustworthy enough to act on. Capabilities are sequenced so that nothing is built on top of a layer that hasn't already been validated — dashboards and risk analysis come after the matrix and CI check are proven, not before, because their entire value is derivative of the graph underneath them being right. A phase is not "done" when the feature exists; it's done when the [use case](use-cases.md) it serves is genuinely satisfied end to end.

This roadmap describes phases, not dates. Sequencing is fixed; timing depends on what Phase 0 and Phase 1 reveal about how tractable ecosystem data actually is to model, which is exactly the kind of thing that shouldn't be estimated in advance.

## Status

Phases 0–2's capabilities are implemented and tested against real, recorded Midnight ecosystem data (`core/`, `plugins/midnight`, `interfaces/`) — see [repository-structure.md](architecture/repository-structure.md) for what exists where. What each phase's exit criterion below still asks for and hasn't happened yet: Midnight maintainer review of the rule set (Phase 0), the Action running on a real Midnight repository's CI and having caught (or been checked against) a real historical incompatibility (Phase 1), and the Upgrade Advisor / Breaking Change Detection queries being confirmed correct against a real past upgrade (Phase 2). Phase 3 (Ecosystem Observability) and Phase 4 remain future work as described below.

## Phase 0 — Foundation

**Goal:** Prove the domain model and ingestion boundary against real Midnight ecosystem data, before any capability is exposed to a user.

- Finalize the domain model (component, release, compatibility relationship) against real data from a small, representative slice of the ecosystem — enough component types (an SDK package, the compiler, the node) to validate the model isn't overfit to one kind of source
- Build the ingestion plugin interface and the first one or two plugins against it (e.g., GitHub release metadata, an npm-style package manifest)
- Define the initial compatibility rule set with Midnight maintainer input — this is where "what does compatible even mean for this ecosystem" gets answered concretely, not assumed
- No public delivery surface yet; success is a correct, inspectable graph over a real (if narrow) subset of the ecosystem

**Explicitly not in scope:** full ecosystem coverage, any CLI or CI surface, any UI.

**Phase exit criterion:** the domain model has been exercised against real data from at least two structurally different component types without requiring a redesign, and the initial rule set has been reviewed by someone who maintains a Midnight component, not just designed in isolation.

## Phase 1 — Compatibility Matrix & CI Compatibility Check

**Goal:** Ship the smallest thing that closes the loop described in the [business case](business-case.md): a check that runs on every relevant pull request and would have caught a real historical incompatibility if it had existed at the time.

- CLI exposing the Compatibility Matrix query over the Phase 0 dataset
- GitHub Action wrapping the same query, configurable per repository, producing a pass/fail CI check
- Coverage expanded to the core components most directly implicated in day-to-day breakage (SDK packages, compiler, node, at minimum)

**Explicitly not in scope:** Upgrade Advisor, breaking-change detection, any dashboard, private/enterprise features.

**Phase exit criterion:** the Action is running on at least one real Midnight repository's CI, and has either caught a real incompatibility or been validated against a past incident it would have caught. A compatibility tool that hasn't been checked against a real historical failure hasn't earned trust yet.

## Phase 2 — Upgrade Advisor & Breaking Change Detection

**Goal:** Move from "is this pair compatible" to the two questions that actually drive engineering decisions: "can I upgrade" and "what did this release change."

- Upgrade Advisor: given a current stack and a target upgrade, return what else needs to move and what (if anything) is unsafe
- Breaking Change Detection: given two releases, return which compatibility relationships changed and what depends on the ones that broke
- Extends the same CI Action from Phase 1 to flag advisor-level risk (e.g., "this PR bumps a dependency that has known downstream breakage"), not just direct incompatibility

**Explicitly not in scope:** aggregate/ecosystem-wide risk views, hosted dashboard.

**Phase exit criterion:** both queries have been validated against a real historical upgrade or breaking change in the ecosystem, producing the answer a maintainer or developer would confirm was correct in hindsight.

## Phase 3 — Ecosystem Observability

**Goal:** Serve the maintainer- and enterprise-level use cases from [use-cases.md](use-cases.md) that need an aggregate view, not a single query result.

- Release Health signal — surfaces components and templates with disproportionate or growing unresolved incompatibility, closing the "broken examples" gap directly
- Repository Relationship Map and Dependency Graph — visualization over the domain core's existing graph, not new underlying data
- Ecosystem Risk Analysis — aggregate risk view for maintainers and adoption reviewers
- Environment Validation — a check an organization can run against its own declared stack (including, for enterprise use, private/internal components)
- Version Diff Reports — human-readable summaries of what changed between two releases, generated from the same data Breaking Change Detection already computes

**Explicitly not in scope:** the hosted dashboard itself is a delivery surface decision, addressed alongside this phase but tracked separately as an architecture/product decision, not assumed as part of the phase's definition of done.

**Phase exit criterion:** at least one of these views has been used by a Midnight maintainer or an evaluating enterprise to make a real decision, not just demonstrated.

## Phase 4 and Beyond — Open-Ended

Deliberately not fully specified here, because committing to specifics this far out would violate the same discipline this roadmap asks every earlier phase to follow: build what a validated use case demands, not what sounds complete. Known candidates, none committed:

- Hosted dashboard as a first-class delivery surface
- Enterprise tier: private policies, SLA-backed advisories, audit exports (see [business-case.md](business-case.md))
- Broader ecosystem source coverage as new SDKs, languages, or registries enter the Midnight ecosystem
- Deeper GitHub Action capabilities (e.g., suggested remediation, not just detection)

## What Is Out of Scope, Full Stop

Independent of phasing — these are not "later," they are excluded on architectural and philosophical grounds stated in [vision.md](vision.md) and [architecture-overview.md](architecture-overview.md):

- Dependency resolution or package management
- AI/ML-based compatibility prediction
- Any capability that reasons about chain state, transactions, or contract execution
- Support for ecosystems other than Midnight (Compass is not being designed as a generic multi-ecosystem product; if that ever becomes a real question, it is a fork-the-strategy decision, not a roadmap item)

## How This Roadmap Gets Revised

Every phase boundary above is a decision point, not a formality. If Phase 0 reveals the domain model doesn't hold up against real data, or Phase 1's CI Action produces enough false positives to erode trust rather than build it, the right response is to stop and fix the layer underneath, not to proceed to the next phase on schedule. Significant revisions to this roadmap should be recorded as an ADR (see [docs/adr/](adr/)) so the reasoning behind a change in direction isn't lost.
