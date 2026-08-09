# Execution Flow (Capture)

What happens between an agent reporting an event and that event becoming
part of a permanent, hash-chained record — including the point where a
terminal lifecycle event triggers automatic sealing.

```mermaid
sequenceDiagram
    participant Agent as Agent Runtime
    participant API as POST /events
    participant UC as CaptureEventUseCase
    participant Masumi as MasumiAdapterPort
    participant Journal as Execution Journal
    participant Storage as StoragePort

    Agent->>API: Event (lifecycle | tool | decision | payment)
    API->>UC: execute(command)
    UC->>UC: validate schema + domain invariants
    alt event kind is "payment"
        UC->>Masumi: enrichPayment(payload)
        Masumi-->>UC: enriched payload (or original, on failure)
    end
    UC->>Journal: append(event, snapshot)
    Journal->>Storage: appendJournalEntry(entry)
    Journal-->>UC: JournalEntry (hash-chained)
    UC->>Storage: saveExecution(execution)
    opt terminal lifecycle event (completed | failed)
        UC->>Journal: seal(executionId)
        Journal-->>UC: ExecutionArtifact (immutable)
    end
    UC-->>API: CaptureEventResult
    API-->>Agent: 201 { executionId, sequence, entryHash, sealedArtifactId }
```

**Reading it:** every event is validated before it touches the Journal.
Payment events are the one place a live external call happens
(`MasumiAdapterPort.enrichPayment`, detailed in
[`masumi-integration.md`](masumi-integration.md)) — and it never blocks
capture even if that call fails. Sealing into an immutable
`ExecutionArtifact` is automatic the moment a terminal lifecycle event
arrives; nothing about capture requires a caller to explicitly "finish" an
execution.

Source of truth: [`packages/application/src/capture/capture-event-use-case.ts`](../../packages/application/src/capture/capture-event-use-case.ts).
