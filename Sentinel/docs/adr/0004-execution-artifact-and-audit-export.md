# ADR-0004: Execution Artifact as a Portable Record, Extended to the Full Audit Export

## Status

Accepted. Implemented, in two stages.

## Context

Trace Search over a live database serves in-place inspection well but
doesn't answer: can I replay this execution on my laptop, without
database access? Can I hand one file to an auditor and have it be
sufficient on its own? Can a build pipeline diff two runs?

## Decision — stage 1 (Step 3.2): the Execution Artifact

A completed (or explicitly sealed) Execution becomes an
**ExecutionArtifact**: a frozen, portable, content-addressable bundle
— full `timeline`, `snapshots`, identity fields, `rootHash`,
`schemaVersion`. `sealJournal` is the only function that produces one;
sealing is idempotent (re-sealing an already-sealed Execution returns
the existing artifact, never mints a second `artifactId` for identical
content).

## Decision — stage 2 (Step 3.3): the Audit Export bundle

An artifact alone doesn't carry verification, replay, or explanation —
those are richer analysis _of_ an artifact, not properties stored on it.
`ExecutionAuditExport` wraps the artifact with a materialized hash
chain, a `VerificationReport`, a `ReplaySession`, and an
`EngineeringExplainabilityReport` into one envelope, assembled by
`assembleExecutionAuditExport`.

**This changed `ExportPort`'s signature** from `render(artifact, format)`
to `render(bundle, format)` — a narrow, additive extension of an
already-approved port, made because the alternative (a separate,
uncoordinated export path for "artifact" vs. "full audit report") would
have meant two different definitions of "the export" existing
simultaneously.

## Consequences

- `GET /executions/:id/artifact` (raw artifact) and
  `GET /executions/:id/export` (full audit bundle) are deliberately two
  different endpoints returning two different shapes — conflating them
  would have forced every artifact fetch to also pay for replay +
  explainability generation.
- The hash chain is _recomputed_, not stored per-entry, in both the
  artifact and the export bundle — `verifyArtifact` and
  `assembleExecutionAuditExport` share one implementation
  (`recomputeHashChain`) so there is exactly one way this computation
  happens, not two that could silently diverge.
- No artifact signing yet (`ExecutionArtifact.signature` stays `null`) —
  tamper-evidence today is the hash chain alone, not a cryptographic
  signature over it. Tracked in `roadmap.md`.
