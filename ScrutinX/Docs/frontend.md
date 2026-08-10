# Frontend architecture

The demo UI. Designed to be **built fast in the hackathon** *and* **extendable afterward** (into a real
dashboard for multiple dApps). Read [`architecture.md`](./architecture.md) for the system and
[`offchain-spec.md`](./offchain-spec.md) for the pipeline this UI drives.

---

## 1. Stack decision (ADR-009) — and why

| Concern | Choice | Why this, for this project |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | We need **server API routes** — the real settlement signs with a seed key and MUST run server-side (`/api/settle`); a plain SPA can't. Next also gives one-command deploy (Vercel) for a shareable demo link, SSR/CSR flexibility, and the cleanest path to grow into a product. |
| Styling | **Tailwind CSS** | Fast to build, consistent spacing/color tokens, trivial dark mode, no CSS-file sprawl. Extendable via `tailwind.config.ts` tokens. |
| State | **Zustand** | One small global store for the live pipeline state (queue, graph, results, fees). Less ceremony than Redux, no prop-drilling, easy to extend with slices. |
| Contention graph | **self-contained inline SVG** (circular layout) | Deterministic ring layout: nodes on a circle, conflict edges as chords, chosen MIS highlighted green. **Zero external dependency** — verified in-browser. (We initially tried `react-force-graph-2d` but its dynamic chunk fails to load in a Next production build → blanked the page; the SVG is more reliable and fully controllable.) |
| Charts | **Recharts** | Congestion history sparkline + "fees saved over time"; React-native, lightweight. |
| Polling | plain `fetch` + a `useInterval` hook (SWR optional) | The agent loop is client-side; we only poll `/api/congestion`. Keep it simple; swap to WebSocket/SSE later (extension point §8). |
| Animation (optional) | **Framer Motion** | Smooth number counters and batch transitions. Nice-to-have, not required. |

**Alternatives considered:** Vite+React SPA (rejected — no safe server route for signing); React Flow instead
of force-graph (great for structured/draggable node editors, heavier for a dynamic force layout — keep as an
alternative if you want draggable nodes); Redux (overkill for a 6h scope).

> **One app, not two.** The frontend and the API routes live in the **same Next.js app** (`demo-app/`). The
> pipeline's pure logic (`conflictDetector`, `optimizer`, `congestion`) runs **client-side**; only the real
> settlement and real Blockfrost reads run in **API routes** (server, holds secrets). This is the whole
> "demo always works, real chain behind a toggle" model (AGENT.md §0).

---

## 2. Folder structure

```
demo-app/
├── app/
│   ├── layout.tsx                 # root layout, theme, fonts
│   ├── page.tsx                   # THE dashboard (composes the panels)
│   ├── globals.css                # tailwind directives + a few tokens
│   └── api/
│       ├── settle/route.ts        # POST — validate body → settleBatch() (real|demo)
│       └── congestion/route.ts    # GET score+mode; POST mode|override
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # title + ModeToggles + congestion slider
│   │   └── DashboardGrid.tsx      # responsive two-column layout shell
│   ├── panels/
│   │   ├── NaivePanel.tsx         # "before": individual txs, failures pile up
│   │   └── BatcherPanel.tsx       # "after": pipeline + batched settlements
│   ├── requests/
│   │   ├── RequestStream.tsx      # live list of incoming UserRequests
│   │   └── RequestCard.tsx
│   ├── graph/
│   │   └── ContentionGraph.tsx    # nodes=requests, edges=conflicts, MIS highlighted (ssr:false)
│   ├── congestion/
│   │   ├── CongestionGauge.tsx    # score [0,1] + current batch window
│   │   └── CongestionSparkline.tsx# recharts history of the score
│   ├── batch/
│   │   └── BatchComposition.tsx   # which requests were grouped / deferred
│   ├── fees/
│   │   ├── FeesSavedCounter.tsx   # running total ADA saved (real data)
│   │   ├── BeforeAfter.tsx        # naive tx count/fee vs batched tx count/fee
│   │   └── SettlementLink.tsx     # Cardanoscan link (real mode only)
│   ├── controls/
│   │   ├── LoadGenControls.tsx    # preset buttons: heavy / spread / mixed
│   │   └── ModeToggles.tsx        # congestion real|demo, settlement real|demo
│   └── ui/                        # dumb primitives — Button, Card, Stat, Toggle, Badge
│       ├── Button.tsx  Card.tsx  Stat.tsx  Toggle.tsx  Badge.tsx
├── lib/
│   ├── agent/                     # ← the off-chain modules (single source of truth)
│   │   ├── config.ts  types.ts  blockfrostClient.ts
│   │   ├── congestion.ts  conflictDetector.ts  optimizer.ts  settlement.ts
│   ├── engine/
│   │   ├── loadgen.ts             # request generators + presets (deterministic seeds)
│   │   └── graphAdapter.ts        # ContentionGraph → force-graph {nodes, links} + MIS flags
│   └── format.ts                  # lovelace↔ADA, short hashes, number formatting
├── stores/
│   └── useBatcherStore.ts         # Zustand store (state + actions) — §4
├── hooks/
│   ├── useBatcherEngine.ts        # owns the client-side agent loop (§5)
│   ├── useCongestion.ts           # polls /api/congestion → store.setScore
│   └── useInterval.ts             # tiny setInterval helper
├── public/
├── .env.local                     # gitignored — secrets (server only)
├── tailwind.config.ts  next.config.js  tsconfig.json (path alias @/*)  package.json
```

**Getting `lib/agent/` populated:** copy `off-chain/src/*` into `demo-app/lib/agent/` (or add a tsconfig
path alias to `../off-chain/src`). Keep **one** copy as the source of truth — don't fork the logic.

---

## 3. Component tree (what renders what)

```
app/page.tsx
└─ DashboardGrid
   ├─ Header
   │   ├─ ModeToggles          (congestion real|demo, settlement real|demo)
   │   └─ CongestionSlider     (demo mode → POST /api/congestion {override})
   ├─ LoadGenControls          (fire a preset burst)
   ├─ NaivePanel
   │   ├─ RequestStream        (same incoming requests)
   │   └─ BeforeAfter (naive side: tx count, failures, fee)
   └─ BatcherPanel
       ├─ CongestionGauge + CongestionSparkline
       ├─ ContentionGraph      (MIS highlighted)   ← the hero visual
       ├─ BatchComposition     (chosen vs deferred)
       └─ fees/
           ├─ FeesSavedCounter (running ADA saved)
           ├─ BeforeAfter (batched side)
           └─ SettlementLink   (Cardanoscan, real mode)
```

**Presentational vs container split:** everything in `components/ui/` and most leaf components are **pure
presentational** (props in, JSX out — trivially reusable/extendable). Only the panels and `page.tsx` read
the store. This separation is what makes it extendable.

---

## 4. State model — `stores/useBatcherStore.ts` (Zustand)

One store holds the whole live pipeline. Types come from `lib/agent/types.ts` (single source of truth).

```ts
import { create } from "zustand";
import type { UserRequest, ContentionGraph, Batch, SettlementResult } from "@/lib/agent/types";
import type { Mode } from "@/lib/agent/config";

interface BatcherState {
  // --- toggles (mirror server for the UI) ---
  congestionMode: Mode;
  settlementMode: Mode;

  // --- live pipeline data ---
  queue: UserRequest[];              // pending requests not yet settled
  graph: ContentionGraph | null;     // current contention graph (for the viz)
  currentBatch: Batch | null;        // last chosen MIS
  results: SettlementResult[];       // every settlement this session
  score: number;                     // congestion [0,1]
  scoreHistory: number[];            // for the sparkline (bounded length)

  // --- derived / display ---
  totalSavedLovelace: number;
  naiveTxCount: number;              // count if each request were its own tx
  batchedTxCount: number;            // actual settlement txs

  // --- actions ---
  enqueue: (reqs: UserRequest[]) => void;
  setQueue: (reqs: UserRequest[]) => void;
  setGraph: (g: ContentionGraph | null) => void;
  setBatch: (b: Batch | null) => void;
  addResult: (r: SettlementResult) => void;
  setScore: (s: number) => void;
  setMode: (which: "congestion" | "settlement", m: Mode) => void;
  reset: () => void;                 // clear for a fresh demo run
}
```

- **Single writer for the loop:** `useBatcherEngine` is the only thing that calls `setGraph/setBatch/addResult`
  per cycle; components only read. Predictable, easy to debug on stage.
- **Bounded history:** cap `scoreHistory` (e.g. last 60 samples) so it never grows unbounded during a long demo.
- **Extend by slicing:** to add, say, per-dApp routing later, add a slice (`dapps`, `routeOf(req)`) without
  touching existing components.

---

## 5. The client-side agent loop — `hooks/useBatcherEngine.ts`

This is the browser twin of the agent loop in [`off-chain/README.md`](../off-chain/README.md). It owns the
timing and calls the pure modules + the API.

```ts
export function useBatcherEngine() {
  const store = useBatcherStore();

  useEffect(() => {
    let cancelled = false;
    async function cycle() {
      while (!cancelled) {
        await sleep(windowMsFromScore(store.score));   // window ADAPTS to congestion
        const reqs = store.queue;
        if (reqs.length === 0) continue;
        const graph = buildContentionGraph(reqs);      // pure
        store.setGraph(graph);
        const batch = selectBatch(reqs, graph, store.score, config.batchCap); // pure
        store.setBatch(batch);
        if (batch.requests.length === 0) continue;
        const result = await fetch("/api/settle", { method: "POST", body: JSON.stringify(batch) })
          .then(r => r.json());                         // real|demo per server toggle
        store.addResult(result);
        const settled = new Set(batch.requests.map(r => r.id));
        store.setQueue(reqs.filter(r => !settled.has(r.id))); // re-queue deferred
      }
    }
    cycle();
    return () => { cancelled = true; };
  }, []);
}
```

Mount it once in `page.tsx`. Congestion comes from `useCongestion()` (polls `/api/congestion`, calls
`store.setScore`), so the loop reads a live, adapting score. **Never** call the real settlement directly from
a component — always via `/api/settle`, so the toggle governs and secrets stay server-side.

---

## 6. Real vs demo in the UI (the toggles)

Two toggles in `ModeToggles.tsx`, wired to the same mechanism the backend uses:

- **Congestion real|demo** → `POST /api/congestion { mode }`. In **demo**, the `CongestionSlider` posts
  `{ override }` so you can drive the score live on stage (Preprod is idle — see `offchain-spec.md` §2).
- **Settlement real|demo** → `POST /api/settle` honors the server's `settlementMode`; expose a UI switch that
  flips it. Keep it on **demo** for most of the demo; flip to **real** for the one money-shot settlement, show
  the `SettlementLink` (Cardanoscan), then flip back for safety.

**Fallback UX (AGENT.md §0.1):** if a real call fails, the store still shows the last good state and the
result falls back to a demo-estimated `SettlementResult` — the screen never blanks. Show a small "demo" vs
"real" `Badge` on each result so it's always honest which path produced a number.

---

## 7. Styling & theme

- Tailwind tokens in `tailwind.config.ts`: a small palette (background, surface, accent, success=green for
  chosen MIS, danger=red for conflicts/failures, muted). Dark mode via `class` strategy.
- **Color-encode the story:** chosen (independent-set) nodes = success/green; conflict edges = danger/red;
  deferred = muted. This makes "concurrency-aware" legible at a glance — the single most persuasive visual.
- **Accessibility:** don't rely on color alone (add labels/shape); AA contrast; the graph has a legend.
- **Numbers:** ADA with fixed decimals + thousands separators (`lib/format.ts`); never show raw lovelace to
  the audience.

---

## 8. Extension points (why this structure is "the bestest" for growth)

Built so post-hackathon growth doesn't require a rewrite:

1. **WebSocket/SSE instead of polling** — replace `useCongestion`'s poll with a subscription; the store API is
   unchanged.
2. **Real multi-dApp routing** — add a `dapps` slice + a `RouteBadge`; the pipeline and graph are agnostic.
3. **Persistence** — the in-memory queue can move behind an API without touching components (ADR-005).
4. **Provider swap** — Blockfrost ↔ Yaci ↔ Koios is an env change (`cardano-tools.md`); UI never knows.
5. **Swap the graph lib** — `graphAdapter.ts` isolates the viz-lib shape, so React Flow ↔ force-graph is a
   one-file change.
6. **New pipeline stages** (e.g. a solver auction) — add a stage in the engine hook; the store/UI extend by
   addition, not modification.
7. **Theming/whitelabel** — all color via Tailwind tokens; no hardcoded hex in components.

---

## 9. Dependencies (exact)

```bash
# in demo-app/
npm i zustand recharts            # graph is inline SVG — no graph lib needed
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm i @lucid-evolution/lucid       # server-side settlement only (real mode)
# optional:
npm i framer-motion swr
```
> ⚠️ **Pin versions** and quick-`npm audit` new deps (AGENT.md §4). The contention graph is hand-rolled SVG
> (no `react-force-graph-2d` — its dynamic chunk broke the Next production build). All panels are wrapped in
> an `ErrorBoundary` so one failing component can never blank the page (AGENT.md §0.1).
>
> **Demo footgun (verified the hard way):** after `npm run build`, the static `/` page embeds hashed chunk
> names — you **must restart `npm run start`** (and kill any stale process on `:3000`) or the browser loads
> old HTML referencing deleted chunks → `ChunkLoadError` → blank page. See `demo-and-testing.md`.

---

## 10. Build order (maps to `build-plan.md` Phase 3)
Shell + layout → primitives (`ui/`) → RequestStream + CongestionGauge (mock data) → ContentionGraph (the hero)
→ fees/BeforeAfter/FeesSavedCounter → LoadGenControls + ModeToggles → wire `useBatcherEngine` + `useCongestion`
to real `/api` routes. Build every component against **mock store data first** so the UI is done before the
backend is (the pure modules make this trivial).
