# Masumi Integration

Sentinel's one live touchpoint with Masumi: a single port, called during
capture, with a hard rule that a Masumi outage degrades enrichment but never
blocks the record from being captured at all.

```mermaid
sequenceDiagram
    participant UC as CaptureEventUseCase
    participant Port as MasumiAdapterPort
    participant Mock as MockMasumiAdapter
    participant Journal as Execution Journal

    UC->>UC: buildEvent(command) — kind === "payment"
    UC->>Port: enrichPayment(payload)
    Port->>Mock: enrichPayment(payload)
    alt phase is "requested", or masumiReference already present
        Mock-->>Port: payload unchanged (nothing to enrich yet)
    else phase is "completed" and no reference yet
        Mock->>Mock: simulatePaymentSettlement({ paymentId, amount, currency })
        Mock-->>Port: payload + masumiReference
    end
    alt enrichPayment resolves
        Port-->>UC: enriched (or unchanged) payload
    else enrichPayment rejects (Masumi unreachable)
        UC->>UC: catch — fall back to payload as reported
    end
    UC->>Journal: append(event with resolved payload, snapshot)
    Note over UC,Journal: capture never blocks on Masumi being reachable
```

**Reading it:** `MockMasumiAdapter` is a real implementation of
`MasumiAdapterPort`, not a hardcoded stub — it has its own deterministic
settlement algorithm and its own test suite. The architectural point this
diagram makes is the call site and the failure contract, both of which are
production code exercised on every capture: a real Masumi client is a
drop-in replacement behind the same port, changing zero lines in
`CaptureEventUseCase`.

Source of truth: [`packages/application/src/capture/capture-event-use-case.ts`](../../packages/application/src/capture/capture-event-use-case.ts)
(`resolvePaymentPayload`), [`packages/adapters/masumi/src/mock-masumi-adapter.ts`](../../packages/adapters/masumi/src/mock-masumi-adapter.ts),
[ADR-0009](../adr/0009-live-masumi-enrichment-at-capture.md).
