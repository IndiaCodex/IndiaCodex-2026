# ADR-0005: Four-Field Identity and Correlation Model

## Status

Accepted. Implemented.

## Context

A bare `ExecutionId` can't answer "show me every run of this workflow"
(needs a stable workflow identifier), "which retries/sub-agent spawns
belong to the same business operation" (needs a correlation identifier
independent of any one run), or "how does this map into the caller's
existing distributed trace" (needs interoperability with tracing
infrastructure Sentinel doesn't own).

## Decision

Every Execution carries four fields, each answering a distinct question:

| Field           | Generation                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `ExecutionId`   | UUIDv7 (time-ordered), generated at capture.                                                             |
| `WorkflowId`    | Developer-assigned stable slug, required on every capture request, never generated.                      |
| `CorrelationId` | Caller-supplied if part of an existing business operation; defaults to `ExecutionId` otherwise.          |
| `TraceId`       | Adopted from an incoming W3C `traceparent` header if present; generated (128-bit, W3C-shaped) otherwise. |

`TraceId` deliberately reuses the W3C Trace Context standard instead of
a Sentinel-specific scheme — free interoperability with an
OpenTelemetry-based observability stack a caller already runs, instead
of requiring manual stitching.

`CaptureEventUseCase` treats identity fields on a non-first event as
must-match-the-existing-Execution, not overridable — a later event that
declares a different `workflowId`/`traceId`/`correlationId` than the one
the Execution started with is rejected (`IDENTITY_MISMATCH`), not
silently accepted.

## Consequences

- `GET /executions` filters by `workflowId`/`traceId`/`correlationId` as
  first-class, indexed query parameters (SQLite adapter indexes all
  three columns).
- UUIDv7 generation and W3C trace-id parsing are hand-rolled
  (`packages/domain/src/shared/uuid.ts`, `identity/trace-id.ts`) against
  the Web Crypto API rather than a dependency or `node:crypto` — keeps
  `@sentinel/domain` runnable identically in Node, browser, and edge
  contexts. The web console doesn't yet import domain's runtime code to
  exploit that (it only imports pure string-literal union types — see
  `architecture.md` §8), but a future client-side "verify this exported
  artifact without a server round-trip" feature could, without any
  change to domain.
