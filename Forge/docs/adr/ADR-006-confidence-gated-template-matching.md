# ADR-006: Confidence-Gated Template Matching

## Context

Per [ADR-003](ADR-003-ai-as-intent-parser-only.md), `adapter-ai`'s intent
classifier always returns _some_ category and confidence score — even for
a description that matches nothing well, it falls back to the closest
available category at a low, honestly-labeled confidence (0.3). Early in
the platform's life, `SelectTemplateUseCase` took whatever the classifier
returned and rendered a contract from it regardless of how weak the match
was. That meant an unrelated request (e.g. "a token vending machine that
mints NFTs") would still silently produce a compiled, tested,
deployment-ready _escrow_ project — technically a complete pipeline run,
but the wrong contract for what was asked, with no signal to the caller
beyond a low number buried in the "why this template" output.

## Decision

`SelectTemplateUseCase` computes a match score for the best candidate
template and, if that score falls below a configurable minimum confidence
(`minConfidence`, default **0.6**), throws `LowConfidenceTemplateMatchError`
instead of returning a selection. The error names the detected confidence,
the required threshold, and every currently supported template, so the
caller knows exactly why it was rejected and what it could ask for
instead. `BuildFromDescriptionUseCase` runs template selection _before_
scaffolding a project, so a rejected match leaves no directory, no file,
and no partial project behind — rejection is a true no-op, not a partial
failure. The threshold is exposed as `forge build`'s `--min-confidence
<0-1>` flag, not hard-coded, since different callers may have different
risk tolerance.

## Alternatives Considered

- **Keep the best-effort fallback (original behavior).** Rejected: it
  optimizes for "the CLI never errors" over "the CLI never produces the
  wrong contract," which is backwards for a tool whose entire trust
  argument is that generation is deterministic and auditable. A
  low-confidence guess that still compiles and deploys is a more dangerous
  failure mode than a loud, immediate rejection.
- **Prompt the user interactively to confirm a low-confidence match.**
  Rejected: `forge build` is a one-shot, scriptable command with no
  interactive prompt anywhere else in the platform; adding one here would
  be a special case, and it doesn't fit a CI/automation context where
  `forge build` might run unattended.
- **Hard-code the threshold rather than exposing it as a flag.** Rejected:
  the right threshold is a judgment call that depends on how many
  templates exist and how distinct their categories are — reasonable today
  at one template, but something a maintainer should be able to tune as
  the template library (see [ADR-004](ADR-004-template-engine.md)) grows,
  without a code change.
- **Gate on the classifier's raw intent confidence instead of the final
  template match score.** Rejected: intent confidence alone doesn't
  capture whether the guessed category corresponds to a real, registered
  template at all — the match score (`categoryMatch × confidence`)
  correctly collapses both "the classifier wasn't sure" and "the
  classifier was sure about something nothing implements" into one
  auditable number.

## Consequences

With exactly one template registered today, rejection triggers whenever
intent classification itself is unconfident (since the classifier's own
fallback always resolves to that one category) — the threshold becomes
more discriminating, and more valuable, as the template library grows past
one entry. Some legitimately-phrased but keyword-sparse descriptions will
be rejected and need rephrasing, or an explicit lower `--min-confidence`;
that friction is an accepted, deliberate trade-off against the alternative
of silently generating a contract nobody asked for. This decision has no
production code cost beyond the check itself — no new port, no new
adapter, no change to the deterministic rendering path it gates.
