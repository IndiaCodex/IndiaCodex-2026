# ADR-0009: Live Masumi Enrichment at Capture Time

## Status

Accepted. Implemented — a correction made during Step 3.8, not part of the
originally approved wiring.

## Context

`MasumiAdapterPort` and `MockMasumiAdapter` existed from Step 3.2 onward,
but nothing called `enrichPayment`. The composition root constructed the
adapter and put it on `AppDependencies`, and the demo scenarios called
`simulatePaymentSettlement` (the adapter's own underlying helper) directly
to pre-compute a `masumiReference` before submitting a payment `completed`
event — bypassing the port entirely. The port's own doc comment hedged on
when it was even meant to be called ("optional at read time"), because that
question had never actually been decided in code.

The practical effect: Sentinel's one deliberate integration point with
Masumi was structurally present and completely inert. For a platform whose
positioning is "the engineering assurance layer _for_ Masumi," an unused
port is worse than no port — it looks like integration without being any.

## Decision

`CaptureEventUseCase` takes `MasumiAdapterPort` as a third constructor
dependency (alongside `StoragePort` and `ExecutionJournalPort`) and calls
`enrichPayment` on every Payment event's payload as part of building the
Event, before it's written to the Journal — see
`resolvePaymentPayload` in
[`capture-event-use-case.ts`](../../packages/application/src/capture/capture-event-use-case.ts).
The demo scenarios no longer pre-compute a Masumi reference; they submit
the payment as the agent itself would observe it (`state: "confirmed"` or
`state: "failed"`, decided by the scenario, no `masumiReference`), and the
live capture path fills the reference in.

Capture time was chosen over read/render time for three reasons:

1. **Visibility.** A judge or engineer watching `pnpm demo` seed its data,
   or a developer capturing a real agent's events, sees the Masumi
   touchpoint fire as part of the normal execution lifecycle — not as a
   separate, easy-to-miss enrichment pass triggered by opening a UI tab.
2. **Permanence.** The enriched payload is what gets hash-chained. A
   read-time enrichment would either have to be re-run on every read
   (nondeterministic timing, and re-introduces exactly the "does this
   still work if Masumi is unreachable right now" fragility ADR-0001
   exists to avoid for replay) or be silently absent from the permanent
   record.
3. **No port signature change.** `enrichPayment(payload): Promise<PaymentPayload>`
   was already shaped for a call that happens once, at the moment a
   payload is being finalized — which capture time is, and read time
   isn't.

The port's failure contract is unchanged and is what makes this safe:
`resolvePaymentPayload` catches a rejected `enrichPayment` call and falls
back to the payload exactly as reported. A Masumi outage degrades
enrichment, never capture — an execution is always fully capturable from
what the agent itself observed, with or without Masumi being reachable at
that instant.

## Why this didn't need the "critical flaw" bar to revisit an approved design

No port signature changed, no new port was introduced, and no dependency
direction changed — `CaptureEventUseCase` already depended on two ports via
constructor injection; this adds a third of the same kind. The change is
"wire up an existing, already-designed seam," not a redesign.

## Consequences

- `CaptureEventUseCase`'s constructor is a breaking change for every call
  site (composition root, every test that constructs it directly) — all
  updated in the same commit to pass a `MasumiAdapterPort` (`MockMasumiAdapter`
  in tests and the demo, a real client is a drop-in replacement later).
- The Explainability tab's Payment Flow table gained a "Masumi Reference"
  column, sourced from the same field the port fills — the UI now shows the
  live integration's output directly, not just data that happened to be
  present in a fixture.
- `packages/application` gained a devDependency on `@sentinel/adapter-masumi`
  (test-only, matching the existing convention for `@sentinel/execution-journal`
  and `@sentinel/storage-memory` in that package).
- A payment's Snapshot (the agent-observed record of the external call) no
  longer embeds `masumiReference` — that field is now exclusively populated
  through the port, so there is one source of truth for "how did this
  reference get here" instead of two.
