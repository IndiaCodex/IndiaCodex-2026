# ADR-0002: Dual-Mode Explainability — Engineering Mode Implemented, Assistant Mode Deferred

## Status

Accepted. Engineering Mode implemented (`@sentinel/explainability`);
Assistant Mode intentionally not built for the Hackathon MVP.

## Context

Sentinel's founding constraint is that engineering logic — capture,
replay, verification, explanation — is never AI-generated, because the
platform whose job is to make agents verifiable cannot itself introduce
an unverifiable, model-generated layer. At the same time, a raw Timeline
is a lot to read, and natural-language summarization is genuinely useful.

## Decision

Explainability is split into two modes at the type level, not just by
convention:

- **Engineering Mode** (implemented): `EngineeringExplanation` and
  `EngineeringExplainabilityReport` are pure, deterministic functions of
  recorded data (`packages/explainability`, zero I/O, zero dependency on
  anything beyond `@sentinel/domain`). Every field — execution summary,
  timeline narrative, tool flow, payment flow, failure analysis — is a
  template over `Event`/`VerificationReport`/`ReplaySession` data.
- **Assistant Mode** (deferred, not built): would produce a distinct
  `AdvisoryExplanation` type via an LLM, behind its own port, never
  substitutable for Engineering Mode output. No code in this repository
  calls an LLM anywhere in the assurance path.

## Consequences

- Every explanation in the product today is provably deterministic —
  the same artifact always produces the same `EngineeringExplainabilityReport`.
- Users who want natural-language summarization beyond the deterministic
  templates don't get it in this MVP. That's an intentional scope cut,
  not an oversight — see `roadmap.md`.
- If Assistant Mode is built later, the type-level separation
  (`AdvisoryExplanation` as a distinct type from `EngineeringExplanation`)
  is what will keep a future contributor from silently laundering
  advisory output into a deterministic code path (Failure Analysis,
  Verification) — worth preserving as the design constraint even before
  the second mode exists.
