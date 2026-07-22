# HTTP API Reference

Base URL: `http://localhost:4000` by default (`SENTINEL_HOST`/`SENTINEL_PORT`).
All bodies are JSON. There is no OpenAPI spec generated yet (tracked in
[`roadmap.md`](roadmap.md)) — this document is the source of truth.

Every error response has the shape:

```json
{ "error": { "code": "SOME_CODE", "message": "human-readable detail" } }
```

## `GET /health`

Liveness/version probe.

```json
{
  "status": "ok",
  "service": "sentinel-server",
  "artifactSchemaVersion": "1.0.0",
  "uptimeSeconds": 42
}
```

## `POST /events`

The Execution Capture pipeline's entry point. Body is a
`CaptureEventCommand` — see
[`packages/application/src/capture/commands.ts`](../packages/application/src/capture/commands.ts)
for the exact discriminated union; shape summary:

```json
{
  "executionId": "<uuid>",
  "workflowId": "customer-refund-agent",
  "correlationId": "<uuid>",      // optional, defaults to executionId
  "traceId": "<32 hex chars>",    // optional, generated if omitted
  "sequence": 0,
  "occurredAt": "2026-07-10T09:00:00.000Z",  // optional, defaults to now
  "metadata": {},                  // optional, defaults to {}
  "kind": "lifecycle" | "tool" | "decision" | "payment",
  "payload": { /* kind-specific, see below */ },
  "snapshot": { /* required for "completed" tool/payment phases and every decision */ }
}
```

Payload shapes by `kind`:

| `kind`      | `payload.phase` | Required fields                                                | Snapshot required? |
| ----------- | --------------- | -------------------------------------------------------------- | ------------------ |
| `lifecycle` | —               | `transition`: `started \| retried \| completed \| failed`      | never              |
| `tool`      | `invoked`       | `toolName`, `arguments`                                        | no                 |
| `tool`      | `completed`     | `toolName`, `arguments`, `result`, `error?`                    | **yes**            |
| `decision`  | —               | `summary`, `rationale?`, `inputRefs` (sequence numbers cited)  | **yes**            |
| `payment`   | `requested`     | `paymentId`, `amount`, `currency`, `masumiReference?`          | no                 |
| `payment`   | `completed`     | `paymentId`, `amount`, `currency`, `state`, `masumiReference?` | **yes**            |

**201** on success:

```json
{
  "executionId": "...",
  "sequence": 0,
  "entryHash": "...",
  "executionStatus": "started",
  "sealedArtifactId": null
}
```

`sealedArtifactId` is non-null exactly when this event brought the
Execution to a terminal status (`completed`/`failed`) — sealing is
automatic, not a separate call.

Every error body also carries a `details` field alongside `code` and
`message` — the flattened zod validation error for `INVALID_ENVELOPE`,
`null` otherwise:

```json
{ "error": { "code": "INVALID_ENVELOPE", "message": "...", "details": { ... } } }
```

Error responses (`error.code` → HTTP status):

| Code                          | Status | Meaning                                                                                                                                                                               |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_ENVELOPE`            | 400    | Failed schema validation.                                                                                                                                                             |
| `INVALID_PAYLOAD`             | 400    | Reserved for payload-level semantic validation beyond schema shape; not yet thrown by any capture path — see [`EventRejectionReason`](../packages/application/src/capture/errors.ts). |
| `UNKNOWN_EXECUTION`           | 404    | First event for this `executionId` wasn't a `lifecycle` `started` event.                                                                                                              |
| `IDENTITY_MISMATCH`           | 409    | `workflowId`/`traceId`/`correlationId` doesn't match the Execution's existing values.                                                                                                 |
| `EXECUTION_ALREADY_TERMINAL`  | 409    | The Execution already reached `completed`/`failed`.                                                                                                                                   |
| `JOURNAL_INVARIANT_VIOLATION` | 422    | Out-of-order sequence, or a Snapshot present/missing where it shouldn't be.                                                                                                           |

## `GET /executions`

List/filter captured Executions.

Query params (all optional): `workflowId`, `traceId`, `correlationId`,
`limit` (default 100). No text search or status filter server-side —
the web console does that client-side over the fetched page (see
[`architecture.md`](architecture.md)).

Returns `Execution[]`, most recently started first.

## `GET /executions/:id`

One `Execution` (identity fields, `status`, full `timeline`). **404** if
unknown, **400** if `:id` isn't a well-formed `ExecutionId`.

## `GET /executions/:id/artifact`

The raw sealed `ExecutionArtifact`, if one exists. **404** if the
Execution hasn't been sealed yet (still in progress and never
explicitly sealed/replayed).

## `POST /executions/:id/replay`

Seals the Journal if it isn't already sealed (validating the live
journal's hash chain), then deterministically replays the resulting
artifact (independently re-verifying its hash chain and root hash).
Returns a `ReplaySession`. Idempotent and safe to call repeatedly —
sealing doesn't produce a new artifact once one exists.

```json
{
  "replaySessionId": "...",
  "sourceArtifactId": "...",
  "sourceExecutionId": "...",
  "replayedTimeline": [/* Event[] */],
  "replayedSnapshots": [/* Snapshot[] */],
  "fidelity": "identical",
  "divergedAt": null,
  "verification": { "valid": true, "checks": { "...": true }, "issues": [] },
  "replayedAt": "..."
}
```

Error codes: `UNKNOWN_EXECUTION` (404, nothing captured for this id),
`JOURNAL_CORRUPTED` (409, the live journal's hash chain doesn't
recompute — tampering at the storage layer), `ARTIFACT_INTEGRITY_FAILED`
(409, the sealed artifact fails independent re-verification; the
response body includes the full `VerificationReport` under `error.report`).

## `GET /executions/:id/explain`

Runs the same seal → replay → explain pipeline as above and returns
only the `EngineeringExplainabilityReport` (execution summary, timeline
narrative, failure analysis, tool flow, payment flow, journal/replay
status). Same error codes as replay.

## `GET /executions/:id/export`

The complete, portable `ExecutionAuditExport` bundle — artifact,
materialized hash chain, verification, replay, and explainability — as a
downloadable JSON file (`Content-Disposition: attachment`). This is the
one file Sentinel considers sufficient, on its own, to audit an
execution with no further access to this API. Same error codes as
replay.
