# API Contracts (High Level)

## Status

This defines the operations the Query API exposes and the shape of their inputs and outputs — enough to design the [Dashboard](interfaces.md#dashboard), the [GitHub Action](interfaces.md#github-action), and third-party integrations against. It deliberately stops short of a wire format specification (exact JSON schemas, an OpenAPI document) — that's an implementation-phase artifact, produced contract-first once these operations are locked, not guessed at here.

## Principle: One API, Every Consumer

There is exactly one Query API. The Dashboard calls it. Third-party integrations call it. The GitHub Action's underlying evaluation logic is the same use case this API exposes. No consumer gets a private, richer path into `core/application` — see [ADR 0009](../adr/0009-dashboard-uses-public-api.md). This is what keeps the API honest: if it's missing something the Dashboard needs, that's a gap in the public API, visible and fixable, not a gap quietly worked around with a backdoor.

## Shape Shared By Every Response

Every read operation returns, alongside its specific result:

- `snapshot` — which Knowledge Graph snapshot the answer was computed against (see [knowledge-graph.md](knowledge-graph.md#versioned-snapshots))
- `evidence[]` — references to the `Evidence` backing the result (not the full records inline by default; a separate lookup keeps large evidence chains from bloating every response)
- `rules[]` — which `Compatibility Rule`(s) produced the result, where applicable

A result with no evidence is `unverified`, not absent — see [compatibility-engine.md](compatibility-engine.md#fail-closed-never-fail-open). The API never omits a result just because Compass has no data; it says so explicitly, because a consumer (especially a CI check) needs to distinguish "known compatible," "known incompatible," and "unknown" as three different, actionable answers.

## Operations

### Compatibility Matrix

`GET /v1/compatibility-matrix`

Input: a set of `Component` identifiers (or a whole ecosystem, if unspecified), optionally scoped to a snapshot.

Output: a set of `Compatibility Relationship` records between the requested components' releases, each with status (`compatible | incompatible | unverified`), evidence, and rules.

Serves the Compatibility Matrix use case in [use-cases.md](../use-cases.md) directly.

### Upgrade Advisor

`GET /v1/upgrade-advice`

Input: a declared current stack (component → release pairs) and a target upgrade (component → target release).

Output: a `Recommendation` (`upgrade | avoid | hold | investigate-further`), the set of other components that would need to move alongside the target, and the relationships/evidence the recommendation is based on.

Serves use case 1 in [use-cases.md](../use-cases.md) ("Can I safely upgrade?").

### Breaking Change Detection

`GET /v1/breaking-changes`

Input: a component and two releases (`from`, `to`).

Output: the set of `Breaking Change` records between them, each naming the affected capability (if any) and the evidence that detected it, plus which known dependents are affected.

Serves use case 3 in [use-cases.md](../use-cases.md) ("What breaks if I ship this?").

### Ecosystem / Environment Risk

`GET /v1/risk`

Input: a scope — a component, a repository, or a caller-declared stack (for [Environment Validation](../use-cases.md#4-platformdevops-engineer-at-an-adopting-enterprise--is-our-stack-still-supported)).

Output: a `Risk` record (`low | medium | high`) with its contributing factors — the specific relationships, breaking changes, and evidence that produced the level. Never a bare score with no explanation attached, consistent with the Evidence Model's mandatory-citation invariant.

### Component & Release Lookup

`GET /v1/components`, `GET /v1/components/{id}/releases`

Read access to the raw graph nodes — what the Dashboard's repository relationship views and dependency graphs are built from (see [interfaces.md](interfaces.md#dashboard)). Everything above is a derived query over this same underlying data; this operation exists because sometimes a consumer just needs the graph itself, not a specific interpretation of it.

## CI-Facing Contract

The [GitHub Action](interfaces.md#github-action) consumes `EvaluateChangeCompatibility` — conceptually a scoped combination of the Compatibility Matrix and Breaking Change operations, evaluated against a pull request's declared stack — and reduces it to exactly what a CI gate needs: a pass/fail/unverified verdict, a short human-readable explanation, and the same evidence references every other operation returns, so "why did this fail" is always answerable from the check output itself without a separate lookup.

## Versioning

Every operation is namespaced under `/v1/`. Because the API is the one boundary every consumer — first-party and third-party — depends on equally, it is versioned and changed the same way any public contract is: additive changes freely, breaking changes behind a new version path, deprecation communicated ahead of removal. Compass holding itself to this standard is not optional politeness; it's the same discipline Compass asks the rest of the Midnight ecosystem to practice.
