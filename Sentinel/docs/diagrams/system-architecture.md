# System Architecture

Where Sentinel sits relative to an agent runtime and Masumi. Sentinel is
infrastructure that observes and verifies — never the agent, never the
payment protocol.

```mermaid
flowchart LR
    Agent["Agent Runtime<br/>(your code)"]

    subgraph Sentinel["Sentinel"]
        direction TB
        API["apps/server<br/>Fastify API — :4000"]
        Web["apps/web<br/>React Console — :5173"]
        DB[("SQLite<br/>apps/server/data/sentinel.db")]
        Web -->|"HTTP (TanStack Query)"| API
        API --> DB
    end

    Masumi[("Masumi Protocol<br/>identity · registry · payments")]

    Agent -->|"POST /events"| API
    API -->|"MasumiAdapterPort.enrichPayment()<br/>live, during capture"| Masumi
    Agent -.->|"payments, identity<br/>(direct integration)"| Masumi

    style Sentinel fill:#11151d,stroke:#4a90f0,color:#e9ecf3
    style Masumi fill:#171c26,stroke:#4a90f0,color:#e9ecf3
```

**Reading it:** an agent's own code talks to Masumi directly for identity and
payment settlement, exactly as it does today. It additionally reports every
event it produces to Sentinel's capture API. The one place Sentinel itself
talks to Masumi is a single, narrow call — `MasumiAdapterPort.enrichPayment()`
— fired live while a payment event is being captured (see
[`masumi-integration.md`](masumi-integration.md) for that call in detail).

Source of truth: [`apps/server/src/composition.ts`](../../apps/server/src/composition.ts),
[`apps/server/src/app.ts`](../../apps/server/src/app.ts).
