# off-chain — the batcher agent

Real Preprod path **and** a simulated demo path, both behind runtime toggles. The app runs with
**zero chain access** by default (`demo`), and you flip to `real` when the validator is deployed —
or live from the UI. See [`../Docs/6hr-sprint.md`](../Docs/6hr-sprint.md).

## Files
| File | What |
|---|---|
| `config.ts` | Central config + the two **toggles** (`congestionMode`, `settlementMode`) |
| `types.ts` | Shared types |
| `blockfrostClient.ts` | Blockfrost wrapper (server-side; rate-limited) |
| `congestion.ts` | Congestion Predictor — `real` (Blockfrost) / `demo` (slider + wave) sources, same EWMA |
| `conflictDetector.ts` | Contention graph (pure) |
| `optimizer.ts` | Greedy MIS batch selection (pure) |
| `settlement.ts` | `settleReal` (Lucid/Preprod) / `settleDemo` (simulated), one `settleBatch()` entry |

## Install
```bash
npm i            # base
npm i @lucid-evolution/lucid   # only needed for SETTLEMENT_MODE=real
```

## The two toggles

```ts
import { config, setCongestionMode, setSettlementMode } from "./config";

setCongestionMode("real");   // pull live block fullness from Blockfrost
setCongestionMode("demo");   // use the slider / synthetic wave

setSettlementMode("real");   // real batch tx on Preprod (server-side only)
setSettlementMode("demo");   // simulated SettlementResult, no chain call
```
Both default to `demo`. **Rule:** keep the app usable in `demo` at all times so a Preprod hiccup
never blanks the demo (sprint fallback ladder). Flip the settlement toggle only for the real-tx moment.

## Wiring: the agent loop
```ts
import { CongestionPredictor } from "./congestion";
import { buildContentionGraph } from "./conflictDetector";
import { selectBatch } from "./optimizer";
import { settleBatch } from "./settlement";
import { config } from "./config";
import type { UserRequest, SettlementResult } from "./types";

const predictor = new CongestionPredictor();
const queue: UserRequest[] = [];               // filled by POST /request or the loadgen

export async function startAgent(onSettled: (r: SettlementResult) => void) {
  await predictor.start();                     // begins polling (real) or waving (demo)
  loop(onSettled);
}

async function loop(onSettled: (r: SettlementResult) => void) {
  while (true) {
    await sleep(predictor.windowMs());         // window ADAPTS to the congestion score
    if (queue.length === 0) continue;
    const reqs  = queue.splice(0, queue.length); // snapshot; deferred ones get re-queued below
    const graph = buildContentionGraph(reqs);
    const batch = selectBatch(reqs, graph, predictor.score, config.batchCap);
    if (batch.requests.length === 0) continue;

    const result = await settleBatch(batch);   // real OR demo, per the toggle
    onSettled(result);

    const settled = new Set(batch.requests.map((r) => r.id)); // re-queue the losers for next cycle
    for (const r of reqs) if (!settled.has(r.id)) queue.push(r);
  }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
```

## Wiring: Next.js API routes (real path is server-side)
```ts
// app/api/settle/route.ts   — runs on the server, can read WALLET_SEED
import { settleBatch } from "@/off-chain/src/settlement";
export async function POST(req: Request) {
  const batch = await req.json();
  return Response.json(await settleBatch(batch)); // honors SETTLEMENT_MODE
}

// app/api/congestion/route.ts — expose score + let the UI flip the toggle / drive the slider
// GET  -> { score }         ; POST { mode } or { override } -> predictor.setMode / demo.setOverride
```

## Frontend toggles (what the UI buttons do)
- **Congestion: Real ↔ Demo** → `predictor.setMode(...)`. In demo, a slider → `predictor.demo.setOverride(v)`.
- **Settlement: Real ↔ Demo** → `setSettlementMode(...)`. Keep on `demo` until the real-tx moment,
  then flip, submit one real batch, show the Cardanoscan link, flip back if needed.
