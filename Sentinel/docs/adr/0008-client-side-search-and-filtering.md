# ADR-0008: Client-Side Search/Filter/Sort Over a Fetched Page

## Status

Accepted. Implemented.

## Context

The Executions page (Step 3.4) needs search-by-text, status filtering,
and sortable columns. `StoragePort.searchExecutions` (approved in Step
3.1) only supports filtering by the four identity fields
(`executionId`/`workflowId`/`traceId`/`correlationId`) plus a result
limit — no text search, no status filter, no sort order.

## Decision

`GET /executions` (new in Step 3.4) exposes exactly the `StoragePort`
query surface — `workflowId`/`traceId`/`correlationId`/`limit` — and
nothing more. The web console fetches one bounded page (`limit=200` for
the Executions list, `limit=20` for the Dashboard) and does text search,
status filtering, and column sorting entirely client-side
(`apps/web/src/pages/ExecutionsPage.tsx`).

## Alternatives considered

- **Extend `StoragePort` with text search / status filter / sort
  parameters.** Rejected for the Hackathon MVP: grows a domain port for
  a scale (a handful of demo executions) this project isn't operating
  at, and a real text-search implementation has adapter-specific
  tradeoffs (SQLite `LIKE` vs. a real search index) worth deciding
  deliberately later, not smuggling in as a UI-driven afterthought.

## Consequences

- Correct today; wrong at scale. Once execution counts grow past what's
  reasonable to fetch in one page, this needs revisiting — either a real
  paginated/searchable `StoragePort` query, or a separate read-optimized
  search index. Tracked in `roadmap.md`.
- The Dashboard's Integrity Summary stat (Step 3.4) has the same shape
  of limitation, for a different reason: it replays every terminal
  execution in the fetched page, live, to compute "N/M verified" —
  genuinely computed, not cached, because Sentinel doesn't persist
  verification results anywhere. Fine at demo scale; would need a
  cached/precomputed approach at real scale.
