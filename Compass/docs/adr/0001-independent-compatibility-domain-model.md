# 0001. An Independent Domain Model Scoped Strictly to Compatibility

## Status

Accepted

## Context

Compass's core value depends on being a narrow, trusted source of truth for one specific question: whether declared components are compatible with each other. Determinism, traceability, and "no magic" are broadly held engineering values, and that creates a real temptation to widen Compass's domain model to cover other kinds of engineering verification it could plausibly reason about — general release quality, execution-level correctness, or a broader notion of "trust" across the ecosystem — on the theory that a bigger model surface reuses more of the same underlying rigor.

A wider domain model sounds efficient. In practice it means the model has to serve two audiences with different questions, different data shapes, and different notions of what "correct" means — which erodes the very narrowness that makes any single answer easy to trust.

## Decision

Compass's domain model — components, releases, and compatibility relationships — is scoped strictly to compatibility intelligence and nothing else. It imports no abstractions from adjacent verification problems, and it does not grow to accommodate concerns that aren't, at their core, about whether two released components work together.

## Alternatives Considered

**Generalizing the domain model to cover broader software verification or correctness concerns.** Rejected because compatibility relationships and other verification concerns don't share a natural abstraction — a model built to answer both ends up serving neither well, and the resulting ambiguity about what a given answer actually means is precisely what would undermine trust in a signal meant to gate a merge.

**Treating compatibility intelligence as a feature within a broader, general-purpose verification platform.** Rejected because it would dilute the clarity of what Compass is for. A Midnight engineer should be able to look at Compass and immediately understand the one question it answers, without first having to understand a larger platform's scope to know whether this particular answer applies to them.

## Consequences

This keeps Compass's domain model small enough to be fully specified, fully tested, and fully explainable on its own terms — every future capability (the matrix, the advisor, breaking-change detection, risk views) is a new way of querying the same compatibility graph, not a new kind of model bolted onto it. It also means that if a genuinely adjacent problem emerges later — one that seems to want to share this model — that should be treated as a signal to examine the fit carefully via a new ADR, not a reason to quietly widen the model to fit it.
