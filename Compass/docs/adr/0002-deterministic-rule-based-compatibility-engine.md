# 0002. Deterministic, Rule-Based Compatibility Engine (Not ML-Based)

## Status

Accepted

## Context

Determining whether one software release is compatible with another can be approached at least two ways: as a declarative reasoning problem, evaluating explicit rules (semantic version constraints, declared peer dependencies, maintainer-declared compatibility, observed CI results) against observed data; or as a prediction problem, inferring the likelihood of compatibility from patterns in historical data using statistical or machine-learning methods. The second approach is tempting because it could, in principle, surface signal the first approach misses — subtle compatibility issues no explicit rule captures — and because "ecosystem intelligence" is the kind of phrase that invites an ML-based interpretation by default.

Compass's core consumers are engineers deciding whether to proceed with an upgrade and CI pipelines deciding whether to block a merge. Both need an answer they can act on with confidence, and both need to be able to understand why a given answer was produced when it matters — particularly when a CI check fails and a developer needs to know whether to fix their change or dispute the check.

## Decision

Compass's compatibility engine is rule-based and deterministic. Every compatibility relationship it produces must be traceable to a specific rule and a specific piece of observed input data. Given the same ecosystem state and the same rule set, the same query must produce the same answer, every time.

## Alternatives Considered

**ML-based compatibility prediction.** Rejected for this product, not because it couldn't produce useful signal, but because it trades away the property Compass's use cases depend on most: a CI check or an upgrade decision needs to be defensible and explainable, not merely statistically likely to be right. A false positive from an inference model blocking a merge, with no explanation better than "the model flagged this," would erode trust in the tool faster than the value of its true positives could rebuild it — and trust, once lost in a tool that gates merges, is very hard to earn back. This is consistent with the product being explicitly positioned as platform engineering, not an AI application (see [vision.md](../vision.md)).

**Hybrid: rules by default, ML-assisted suggestions as a separate, clearly-labeled signal.** Not rejected outright — this remains a plausible future direction for something like risk scoring in Phase 3 ([roadmap.md](../roadmap.md)), where the output is advisory context for a human reviewer rather than a pass/fail gate. It is out of scope for the core engine specifically because the core engine's output gates CI and drives upgrade decisions, where the determinism requirement is non-negotiable. If a hybrid signal is pursued later, it should be a clearly separate, opt-in capability, not a change to how the core compatibility matrix is computed — and should get its own ADR when proposed.

## Consequences

This means Compass's initial rule set will sometimes be less complete than a well-trained model might eventually be — some real compatibility issues may go undetected simply because no rule or declared data captures them yet. That gap is intentional: it is closed over time by adding rules and improving data ingestion, in a way where every improvement is auditable, rather than by accepting an opaque accuracy tradeoff from the start. It also means the domain core ([architecture-overview.md](../architecture-overview.md)) can be fully unit tested against fixed inputs and expected outputs — a property that would be substantially harder to guarantee for a model-based engine.
