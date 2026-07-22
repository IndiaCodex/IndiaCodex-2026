# 0006. Evidence Is Mandatory; Absence of Data Resolves to Unverified, Never Compatible

## Status

Accepted

## Context

Compass's answers are meant to gate a merge and inform an upgrade decision — consumers act on them directly, often without independently re-verifying. That only works if a `Compatible` result reliably means "there is a specific, checkable reason to believe this," not merely "nothing indicated a problem." Those two things sound similar but are very different guarantees, and systems that quietly conflate them tend to do so for a good short-term reason (fewer false alarms, smoother output) that produces a bad long-term one (false confidence exactly when a real problem exists but wasn't detected).

This decision determines what happens at every failure edge in the system: a source is unreachable, a manifest fails to parse, no rule applies to a given pair of releases. Each of these is a point where the system has to decide what to report, and the decision has to be made once, consistently, rather than case by case.

## Decision

Every `Compatibility Relationship` (and everything derived from it — `Risk`, `Recommendation`) must cite at least one `Evidence` record. A relationship with no evidence is `Unverified` by construction — never assumed `Compatible`, and never assumed `Incompatible`. This is enforced as a domain invariant (see [domain-model.md](../architecture/domain-model.md#invariants)), not a convention rule packs are expected to honor voluntarily.

## Alternatives Considered

**Defaulting to `Compatible` when no rule flags a problem** (an "innocent until proven incompatible" stance). Rejected because this is the exact failure mode this whole product exists to close: silent incompatibility discovered too late. A tool that reports `Compatible` on the basis of having found no evidence either way is indistinguishable, from a consumer's perspective, from a tool that actually verified compatibility — until the moment it's wrong, at which point trust in every other answer it's given is also justifiably in question.

**A probabilistic or scored default** (e.g., "70% likely compatible based on typical patterns"), which would let the system express partial confidence instead of a hard `Unverified`. Rejected for the same reason model-based inference was rejected in [ADR 0002](0002-deterministic-rule-based-compatibility-engine.md): a score is not reproducible or traceable to a specific rule and fact in the way this architecture requires, and CI cannot make a clean pass/fail decision from a probability without Compass itself making an arbitrary threshold call on the consumer's behalf.

## Consequences

`Unverified` is a legitimate, frequent, and honest result — especially early on, before rule packs and ingestion coverage are mature — and every consumer (CLI, Action, Dashboard, API) must treat it as materially different from both `Compatible` and `Incompatible`, never collapsing it into either for display convenience. This means Compass will sometimes have less to say than a less careful tool might claim to. That's accepted deliberately: an honest "we don't know" preserves the trust a false "it's fine" would spend.
