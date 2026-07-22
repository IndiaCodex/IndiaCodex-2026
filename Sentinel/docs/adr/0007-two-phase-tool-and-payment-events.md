# ADR-0007: Two-Phase Tool and Payment Events

## Status

Accepted. Implemented — a correction made during Step 3.2, not part of
the originally approved event model.

## Context

The approved architecture modeled a tool call and a payment as one
event each: `ToolPayload` carried `toolName`, `arguments`, and `result`
together, meaning nothing was captured until the call had already
returned. Step 3.2's actual Execution Capture requirements enumerated
eight distinct event types, including **Tool Invoked** and **Tool
Completed** as separate events, and **Payment Requested** and **Payment
Completed** as separate events — a real, structurally different model:
an in-flight call has to be observable _before_ its result is known.

Single-shot capture can't represent "this tool call is still running" at
all — a genuine gap for a capture pipeline whose job is to observe a
live agent, not just its finished output.

## Decision

`ToolPayload` and `PaymentPayload` became discriminated unions on
`phase`:

- `tool`: `{ phase: "invoked", toolName, arguments }` →
  `{ phase: "completed", toolName, arguments, result, error? }`
- `payment`: `{ phase: "requested", paymentId, amount, currency }` →
  `{ phase: "completed", paymentId, amount, currency, state, masumiReference? }`

`requiresSnapshot` (ADR-0001) became phase-aware: the `invoked`/
`requested` phase carries no Snapshot (the request itself is
deterministic input, nothing to capture for replay yet); the
`completed` phase always does (it observed the actual nondeterministic
response).

## Why this didn't need the "critical flaw" bar to revisit an approved design

This is additive to the Event/Snapshot envelope, not a change to any
port signature, identity model, or the Execution Journal's hash-chain
mechanism — the four `EventKind` values are unchanged, only the
internal shape of two of their payloads gained a phase discriminant.
Narrower in scope than a re-architecture; treated as an implementation
detail the original design under-specified, not a reopening of Step
3.1's ports or Step 3.3's replay/verification model.

## Consequences

- Every capture pipeline consumer (application, explainability, the web
  console's Tool Flow / Payment Flow views) pairs `invoked`/`requested`
  with `completed` by tool name / payment id, in call order — a FIFO
  queue per key (`@sentinel/explainability`'s `buildToolExecutionSequence`),
  which correctly handles the same tool being called more than once in
  one Execution without mismatching invocations and completions.
- An Execution that's interrupted mid-tool-call is now representable and
  explainable as exactly that (`outcome: "pending"` in the Tool Flow) —
  this is what makes the "interrupted execution" demo scenario
  (`docs/roadmap.md`, Step 3.5) meaningful rather than a degenerate case.
