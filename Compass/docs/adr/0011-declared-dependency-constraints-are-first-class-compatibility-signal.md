# 0011. A Release's Own Declared Dependency Constraint Is a First-Class Compatibility Signal

## Status

Accepted

## Context

Building the first real ecosystem integration (Step 3.2) surfaced a real gap in the Compatibility Engine as specified through Step 3.1: `evaluateCompatibility` evaluated Compatibility Rules from a rule pack against a pair of releases, but never looked at the specific `Dependency.constraint` a release itself had declared (e.g. a real `package.json` version range like `^4.0.4`). A rule pack can encode ecosystem-wide policy ("the runtime must be at least vX"), but it cannot encode what one specific release actually asked for — that fact lives only in the `Dependency` the ingested release itself declared.

Concretely: `example-counter` declares a dependency on `@midnight-ntwrk/midnight-js` at `^4.0.4`. Whether the current `midnight-js` release (`5.0.0-beta.6`) satisfies that declared range is a real, useful compatibility question — and it has nothing to do with any rule pack's policy. Without evaluating the declared constraint directly, Compass would only ever report `unverified` for this pair unless a rule pack happened to hardcode the exact same range, which no rule pack can do generically across every dependent's potentially different declared range.

## Decision

`evaluateCompatibility` now accepts the specific `Dependency` being evaluated (or `null`, for pairwise evaluations not driven by one — e.g. some Upgrade Advisor queries). When present, the dependency's own `constraint` is evaluated against the candidate release exactly as a rule condition would be, and folded into the same conflict-resolution policy: an unsatisfied declared constraint is treated as `incompatible`, on equal footing with an `incompatible` rule conclusion; a satisfied one contributes toward `compatible`. `CompatibilityEvaluation` now exposes `dependencySatisfied: boolean | null` so a consumer can distinguish "no dependency was being checked" from "the dependency was checked and passed/failed."

## Alternatives Considered

**Require every real-world compatibility fact to be expressed as a rule pack rule.** Rejected because it's not possible in principle: a rule pack is fixed, ecosystem-wide policy, authored once; a declared dependency range is per-release, per-dependent data discovered at ingestion time. Forcing the rule pack to somehow encode every dependent's exact declared range would mean regenerating the rule pack on every ingestion run, which defeats the purpose of a rule pack being a stable, reviewable artifact.

**A separate, second compatibility-relationship type just for "declared dependency satisfaction," distinct from rule-based relationships.** Rejected because a consumer (the Compatibility Matrix, the Upgrade Advisor, a future CI check) shouldn't have to know or care whether an `incompatible` verdict came from a rule or from a declared constraint — both are equally real reasons not to proceed. Folding them into the same `CompatibilityRelationship.status` keeps every downstream consumer simple. The distinction is preserved, not lost: `dependencySatisfied` and `firedRules` are both still available on the evaluation result for anything that wants to explain *why*.

## Consequences

The Compatibility Matrix and Upgrade Advisor now report real incompatibilities that exist purely because a dependent's own declared range doesn't match, even with zero rule packs configured — this is the single most valuable behavior added in Step 3.2, and it required no new port, no architecture change, and no new Clean Architecture boundary. The cost: `evaluateCompatibility`'s signature grew by one required field, which meant updating every existing call site (`IngestSnapshotUseCase`, `EvaluateUpgradeUseCase`) and every existing test that called it directly — a one-time, mechanical cost, not a recurring one.
