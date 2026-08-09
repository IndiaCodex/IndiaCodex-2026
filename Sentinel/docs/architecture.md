# Architecture

This is the as-built architecture of Sentinel's Hackathon MVP — every
type, port, and package named here exists in the tree today. For the
reasoning behind specific decisions, see [`docs/adr/`](adr/).

## 1. Principles

- **Clean Architecture / Ports & Adapters.** `packages/domain` has zero
  dependency on any framework, database, or adapter — verified as part
  of the [Step 3.6 production-readiness pass](adr/): grep the package
  for `@sentinel/*` imports and the only hits are doc comments. Everything
  the domain needs from the outside world is expressed as a port
  (interface); frameworks and infrastructure are adapters that implement
  those ports.
- **Determinism over convenience.** Anything nondeterministic at capture
  time (LLM responses, tool responses, external API responses) is
  recorded as a `Snapshot`. Replay never re-invokes a live LLM, tool,
  external API, or Masumi service — it feeds back the recorded response.
  This one rule is what makes deterministic replay possible despite an
  LLM being in the loop, and it is enforced structurally: the domain
  function that appends to the Journal (`appendJournalEntry`) rejects an
  Event that's missing a required Snapshot, or that carries one it
  shouldn't.
- **Engineering logic is never AI-generated.** Verification and
  Explainability are pure, rule-based functions over recorded data. No
  package in this repository calls an LLM.
- **Plugin architecture.** Storage, Masumi integration, and export format
  are each an adapter implementing a domain port. `packages/adapters/`
  holds every adapter; swapping SQLite for Postgres, or JSON export for
  PDF, means adding a new adapter package, not touching domain or
  application code.
- **Feature-first, dependency-direction-enforced package layout.** Code
  is organized by capability, and the dependency graph only ever points
  inward: `apps/* → packages/adapters/* & packages/application →
packages/domain`. `packages/domain` depends on nothing in this
  repository.

## 2. Domain model

All defined in `packages/domain/src`, exported from `@sentinel/domain`.

| Type                                                                     | Role                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ExecutionId` / `WorkflowId` / `CorrelationId` / `TraceId`               | The four-field identity model (§5) — every Execution carries all four.                                                                                                                                                                                                                                                       |
| `Event` (`DecisionEvent \| ToolEvent \| PaymentEvent \| LifecycleEvent`) | One fact in an Execution's Timeline. `Tool` and `Payment` are two-phase discriminated unions on `payload.phase` (`invoked`/`completed`, `requested`/`completed`) — the in-flight phase carries no Snapshot, the completed phase always does.                                                                                 |
| `Snapshot`                                                               | Captured nondeterministic state: the exact request/response of one LLM call, tool call, or external API call.                                                                                                                                                                                                                |
| `JournalEntry`                                                           | One hash-chained record: an `Event`, its `Snapshot` if any, and a hash over both plus the previous entry's hash.                                                                                                                                                                                                             |
| `Execution`                                                              | The aggregate root for one agent run: identity fields, `status`, `timeline: Event[]`.                                                                                                                                                                                                                                        |
| `ExecutionArtifact`                                                      | The frozen, portable, content-addressable seal of a completed Journal: full `timeline`, `snapshots`, `rootHash`, `schemaVersion`. Immutable once sealed.                                                                                                                                                                     |
| `VerificationReport`                                                     | Six independent checks (schema version, event ordering, identity consistency, snapshot consistency, hash chain, root hash) plus a structured issue list — produced by `verifyArtifact`, which recomputes the entire hash chain from an artifact's `timeline` + `snapshots` alone.                                            |
| `ReplaySession`                                                          | The result of `replayArtifact`: the reconstructed timeline/snapshots, `fidelity` (`"identical"` whenever verification passes — Sentinel reconstructs from its own recorded Events rather than re-executing independent agent code, so there's nothing external to diverge from), and the `VerificationReport` that gated it. |
| `EngineeringExplainabilityReport`                                        | Execution summary, per-event timeline narrative, failure analysis, tool flow (invocations paired with completions via a FIFO queue per tool name), payment flow, journal/replay status — all deterministic.                                                                                                                  |
| `ExecutionAuditExport`                                                   | The full portable bundle: artifact + materialized hash chain + verification + replay + explainability + export metadata. What `GET /executions/:id/export` returns.                                                                                                                                                          |

## 3. Ports

| Port                   | Responsibility                                                                       | Implemented by                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `StoragePort`          | Persist/query Executions, Journal entries, Execution Artifacts.                      | `@sentinel/storage-sqlite` (default), `@sentinel/storage-memory` (ephemeral/tests)                                    |
| `ExecutionJournalPort` | Append to the hash chain; seal a Journal into an Artifact; replay a sealed Artifact. | `@sentinel/execution-journal` (`SentinelExecutionJournal`)                                                            |
| `MasumiAdapterPort`    | Enrich a captured payment with live Masumi state.                                    | `@sentinel/adapter-masumi` (`MockMasumiAdapter` — a real Masumi client is a drop-in replacement behind the same port) |
| `ExportPort`           | Render an `ExecutionAuditExport` bundle to a distributable format.                   | `@sentinel/export-json` (JSON; PDF is a natural second adapter, not built yet)                                        |

`StoragePort` is validated by one shared **contract test suite**
(`@sentinel/storage-memory/contract`), run unmodified against both
adapters — proof they're genuinely interchangeable, not just
structurally similar. A future Postgres adapter reuses the same suite.

`MasumiAdapterPort` is injected into `CaptureEventUseCase` (constructor
dependency, same as `StoragePort` and `ExecutionJournalPort`) and called
live while a Payment event is being written to the Journal — see
[ADR-0009](adr/0009-live-masumi-enrichment-at-capture.md). It is never
load-bearing for capture: a rejected `enrichPayment` call degrades to
"captured data alone," per the port's contract.

## 4. Package map

```
sentinel/
  apps/
    server/                 Fastify HTTP API — the composition root
    web/                    React console (Vite, Tailwind v4, TanStack Query, react-router)
  packages/
    domain/                 Entities, value objects, ports, pure domain services.
                             Zero dependency on anything else in this repo.
    application/            Use cases (CaptureEventUseCase, GenerateExplainabilityReportUseCase,
                             GenerateExecutionAuditExportUseCase). Depends only on domain + explainability.
    execution-journal/       Implements ExecutionJournalPort: append, seal, replay.
    explainability/          Engineering Mode explanation generation (ADR-0002). Pure, no I/O.
    testkit/                 Shared test fixtures built on real domain functions — not published.
    adapters/
      storage-sqlite/         StoragePort over better-sqlite3. No SQL leaks outside this package.
      storage-memory/          StoragePort in-memory — the contract suite's reference implementation.
      masumi/                  MasumiAdapterPort — mock Masumi Payment Service today, invoked live from
                               CaptureEventUseCase (ADR-0009); same seam for a real client later.
      export-json/             ExportPort — portable JSON.
  docs/
    architecture.md          This file.
    api.md                   HTTP API reference.
    development.md           Local dev loop.
    adr/                     Architecture Decision Records.
    roadmap.md               Known limitations, what's next.
    vision.md                Mission, business case, differentiation (Step 1).
  .github/workflows/ci.yml   build → lint → typecheck → test, in that order (see §7)
```

## 5. Identity model

Every `Execution` carries four identity fields, each answering a
different question:

| Field           | Answers                                               | Generation                                                               |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| `ExecutionId`   | Which specific run is this?                           | UUIDv7 (time-ordered), generated at capture                              |
| `WorkflowId`    | Which workflow definition produced it?                | Developer-assigned stable slug, e.g. `customer-refund-agent`             |
| `CorrelationId` | Which business operation is this run part of?         | Caller-supplied, or defaults to `ExecutionId`                            |
| `TraceId`       | How does this map into an existing distributed trace? | W3C Trace Context — adopted from an incoming `traceparent`, or generated |

`TraceId` deliberately adopts the W3C standard rather than a
Sentinel-specific scheme, so an Execution's timeline correlates for free
with a caller's existing OpenTelemetry-based observability.

## 6. Data flow

```
Agent runtime
    │  POST /events   (validated: zod schema + domain invariants)
    ▼
CaptureEventUseCase
    │  a Payment event is first routed through
    │  MasumiAdapterPort.enrichPayment() (live Masumi touchpoint —
    │  ADR-0009); a rejected enrichment degrades to the payload as
    │  reported, never blocks capture
    │  appends to the Journal (hash-chained), updates the Execution
    │  read model, auto-seals on a terminal lifecycle event
    ▼
ExecutionJournalPort.seal()        — idempotent; verifies the live
    │                                 journal's hash chain first
    ▼
ExecutionArtifact  (immutable once sealed)
    │
    ├─▶ ExecutionJournalPort.replay()
    │       verifyArtifact() first (independent re-verification,
    │       no dependency on the live Journal) → throws
    │       ReplayIntegrityError on any failure, otherwise
    │       reconstructs the timeline exactly as recorded
    │       ▼
    │   ReplaySession  (carries the VerificationReport)
    │
    ├─▶ buildExplainabilityReport(artifact, verification, replay)
    │       ▼
    │   EngineeringExplainabilityReport
    │
    └─▶ assembleExecutionAuditExport(artifact, verification, replay, explainability)
            ▼
        ExecutionAuditExport → ExportPort.render() → portable JSON
```

Nothing in this chain requires a terminal lifecycle event to exist — an
interrupted execution (captured, then simply abandoned) can still be
sealed, replayed, verified, explained, and exported. See
[`apps/server/src/demo/interrupted-workflow.ts`](../apps/server/src/demo/interrupted-workflow.ts)
for the demo scenario that proves it.

## 7. Why build precedes lint/typecheck/test in CI

Cross-package imports (`@sentinel/domain`, etc.) resolve through each
package's compiled `dist/*.js` and `dist/*.d.ts` — there's no TypeScript
project-reference graph wiring source-to-source yet (tracked in
[`docs/roadmap.md`](roadmap.md)). Type-aware lint and typecheck therefore
need every workspace package built first; running them before `build` on
a clean checkout fails in a way that's easy to misdiagnose as a real bug.
`pnpm verify` and CI both build first for exactly this reason — this was
a real bug caught during Step 3.1 by running the same pipeline twice in a
row, which is why that's now a standing practice in this repo (see
[`docs/development.md`](development.md)).

## 8. Web console architecture

The web app (`apps/web`) never imports `@sentinel/domain`'s runtime code
— only its pure string-literal union types (`ExecutionStatus`,
`PaymentState`, etc., which survive JSON serialization unchanged). A
hand-written wire-type layer (`src/lib/wire-types.ts`) mirrors the
domain shapes with `Date → string`, deliberately not a generic recursive
`Serialized<T>` over the branded domain types (branded types are
`string & { __brand }` intersections, which don't recurse predictably
through a mapped type). Server state is TanStack Query; routing is
`react-router`, with one nested-route shell per Execution
(`/executions/:id/{replay,verification,explain,artifact}`) sharing a
single header, matching how Jaeger and the Playwright Trace Viewer
organize a single trace's views.
