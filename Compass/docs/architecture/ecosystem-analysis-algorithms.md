# Ecosystem Analysis Algorithms

## Status

This documents three algorithms added or substantially strengthened in Step 3.2, all pure, deterministic views or analyses over data the [Compatibility Engine](compatibility-engine.md) already produces — none of them introduce a new evaluation mechanism of their own. Each is implemented in `core/domain` (pure aggregation) or `core/application` (orchestration over ports), consistent with every architectural boundary fixed in Step 3.1.

## What a Rule Pack Is For, Versus ADR 0011

Before describing the three algorithms, one clarification they all depend on: [ADR 0011](../adr/0011-declared-dependency-constraints-are-first-class-compatibility-signal.md) established that a release's own declared `Dependency` constraint is evaluated automatically, independent of any rule pack. This resolves most of the compatibility categories a rule pack might otherwise seem responsible for:

| Requested category | What actually answers it |
|---|---|
| SDK version compatibility | ADR 0011 — the dependent's own declared range, evaluated against the real target release |
| Runtime compatibility / minimum supported runtime | ADR 0011 — a real `engines.node` field becomes a Dependency, evaluated the same way |
| Missing required capabilities | The `Constraint` model itself — a capability nobody provides simply fails `requiresCapability`, no extra rule needed |
| Deprecated versions | The Midnight rule pack's `prerelease` advisory rule (see [midnight-plugin.md](midnight-plugin.md#rule-pack)) |
| Conflicting versions / multiple incompatible SDKs | `findConflictingComponentVersions` (below) |
| Unknown compatibility state | The engine's inherent `unverified` status — no work required, it's the default absent a signal |
| Breaking dependency changes / removed APIs | `detectBreakingChanges` (Step 3.1) + the Breaking Change Analyzer (below) |

A rule pack's real job is the row nothing else covers: ecosystem-wide *policy* that isn't already a specific declared constraint.

## Compatibility Matrix

**Implementation:** `core/domain/src/compatibility-matrix.ts` — `buildCompatibilityMatrixView` and `evaluateStackCompatibility`.

Two shapes, both pure aggregations over an existing list of `CompatibilityRelationship` records — no new evaluation:

**`buildCompatibilityMatrixView`** produces a component-by-component grid: one cell per directed `(componentA, componentB)` pair with at least one release-level relationship between them, aggregated to the worst status among every release pair evaluated for that component pair. "Worst" follows a fixed precedence — `incompatible` > `unverified` > `compatible` (`worseStatus`) — the same "one confirmed problem outweighs any number of fine or unknown results" precedence used throughout this engine (docs/architecture/compatibility-engine.md#conflict-resolution-is-fixed-and-simple).

**`evaluateStackCompatibility`** answers the more specific question a developer actually names — "is *this exact combination* viable" (e.g. `repo A v1.4 + SDK v5 + runtime v3`) — by filtering to only the relationships where *both* releases are members of the given stack, then applying the same worst-wins aggregation. A stack with no known relationship among any of its members is `unverified`, not a clean bill of health — Compass simply has nothing to say about it yet.

Both are exercised end to end against real Midnight data in `plugins/midnight/test/golden-ingestion.test.ts`, including a real example where the matrix view and a specific release-pair query disagree in an entirely expected way: the `example-counter → compact` cell shows `incompatible` in aggregate (because two tracked `compact` releases predate the capability-naming convention that makes them satisfiable), while several *individual* release pairs underneath that cell are genuinely `compatible`. Both facts are true simultaneously — the matrix view answers "is anything wrong anywhere in this pair," not "is everything wrong."

## Upgrade Advisor

**Implementation:** `core/application/src/use-cases/evaluate-upgrade.use-case.ts` (Step 3.1, now ADR-0011-aware) and `analyze-upgrade-impact.use-case.ts` (new).

Two complementary use cases, matching two different questions a developer asks:

**`EvaluateUpgradeUseCase`** — "if I move *my* stack to this target release, is that safe?" Evaluates the target against every release in the caller-supplied current stack, using each stack release's own declared `Dependency` on the target's component where one exists (ADR 0011) — this means a real, project-specific upgrade check now works even with zero rule packs registered. Produces a `Recommendation` (`upgrade | avoid | hold | investigate-further`) plus a `Risk`, both fully evidence-traceable.

**`AnalyzeUpgradeImpactUseCase`** — the inverse question: "if the *ecosystem* moves to this target release, who does that break?" Scans every release in the current Knowledge Graph snapshot for a declared dependency on the target's component, evaluates each one, and reports three groups: `blockedComponents` (their declared constraint is violated — the "Blocked Components" and "Required Upgrades" the brief asked for, since a blocked component is exactly the one that needs its own upgrade), `compatibleComponentIds` (still fine), and `unverifiedComponentIds` (no evidence to judge either way).

### What Is Deliberately Not Solved Here

**Dependency order and required intermediate versions** — a full topological sort of "what order do N components need to move in, and does any of them need to pass through an intermediate version first" is a genuinely harder, multi-hop graph problem: it requires reasoning about chains of releases across time, not just direct, one-hop declared dependencies. Every check in this milestone is one hop — "does this specific release satisfy that specific declared constraint." Building a general multi-hop dependency-resolution planner is most of the way to reimplementing a package manager's resolver, which [vision.md](../vision.md) explicitly rules out as scope. This is named directly as deferred work, not silently absent.

## Breaking Change Analyzer

**Implementation:** `core/application/src/use-cases/analyze-breaking-change-impact.use-case.ts` (new), built on `detectBreakingChanges` (Step 3.1, pure, in `core/domain`).

Compares the latest release of one component across two Knowledge Graph snapshots — possible at all only because snapshots are versioned and immutable ([ADR 0007](../adr/0007-versioned-immutable-snapshots.md)) — and reports:

- **Added / removed capabilities** — a straightforward set difference over each release's `providedCapabilities`. A capability present in the older release but gone from the newer one is exactly what `detectBreakingChanges` was built to catch in Step 3.1; a capability present only in the newer release is new surface area, reported for completeness.
- **Changed dependency constraints** — every target component either release declares a dependency on, compared structurally; covers a constraint added, removed, or tightened/loosened between the two releases.
- **Affected components** — every other release in the *newer* snapshot with a declared dependency on this component, re-evaluated against the new release. This is the same one-hop mechanism the Upgrade Advisor uses, applied retrospectively instead of prospectively.
- **A Risk**, computed from exactly the relationships constructed while finding affected components — `null`, not a crash, when there happen to be no known dependents at all (a real bug found and fixed during this milestone: `ComputeRiskUseCase` had the identical latent issue from Step 3.1, since `computeRisk` correctly refuses to fabricate a Risk with zero contributing factors — see the ADR 0006 invariant. Both use cases now return `Risk | null` rather than crash on this legitimate, ordinary case of "nothing depends on this yet.")

### Conflicting Versions / "Multiple Incompatible SDKs"

**Implementation:** `core/domain/src/dependency-conflict.ts` — `findConflictingComponentVersions`.

The classic diamond-dependency case: two or more declared dependencies target the same component with constraints no single known release of that component can satisfy simultaneously (e.g. one dependent needs `^1.0.0`, another needs `^2.0.0`, and no tracked release of the target is both). Kept ecosystem-agnostic in `core/domain` rather than Midnight-specific, since diamond dependencies are a property of any dependency graph, not something particular to this ecosystem. Fail-closed like everything else here: a target component with no known releases at all is left alone rather than a conflict being claimed without evidence to back it.
