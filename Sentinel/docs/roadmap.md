# Roadmap

## What's built (Hackathon MVP)

| Phase | Delivered                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1   | Repository scaffold, domain layer, ports, dependency wiring.                                                                                                                                                                                |
| 3.2   | Execution Capture, Execution Journal persistence, SQLite/in-memory storage adapters, mock Masumi adapter.                                                                                                                                   |
| 3.3   | Replay Engine, Verification Engine, Engineering Explainability, Execution Artifact / Audit Export.                                                                                                                                          |
| 3.4   | Web console: Dashboard, Executions, and five per-execution tabs (Timeline, Replay, Verification, Explainability, Artifact).                                                                                                                 |
| 3.5   | Four demo scenarios (success, tool failure, payment failure, interrupted), single-command startup (`pnpm demo`).                                                                                                                            |
| 3.6   | Production-readiness pass: config/CORS/log-level wiring, dependency-graph audit, security scan.                                                                                                                                             |
| 3.7   | Documentation set: README, architecture, API reference, ADRs, contributing guide.                                                                                                                                                           |
| 3.8   | Live Masumi integration (capture-time payment enrichment via `MasumiAdapterPort`), OSS readiness (license, issue/PR templates, security policy, code of conduct), execution-ID truncation fix, Dashboard status-distribution visualization. |
| 3.9   | Release readiness: `docs/releases/v0.1.0.md`, package metadata fixes, `.gitattributes`.                                                                                                                                                    |
| 3.10  | Hackathon presentation package (`presentation/`), seven Mermaid diagrams (`docs/diagrams/`), full screenshot re-capture, `DEMO.md`.                                                                                                        |
| 3.11  | Consistency audit (tagline, API docs), a missing test for a real invariant, `FINAL_REVIEW.md`.                                                                                                                                              |

171 tests across 11 packages. CI runs build → lint → typecheck → test on
every push.

## Known limitations

Honest gaps, not hidden ones:

- **No concurrency control on Journal writes.** Two concurrent
  `append()` calls for the same execution aren't locked. Fine for the
  demo's sequential capture; a real gap before concurrent production use.
- **No migration framework.** SQLite schema is `CREATE TABLE IF NOT
EXISTS` only — acceptable for one schema version, not for evolving one
  in production.
- **No PII/secret redaction.** Captured Snapshots hold raw LLM/tool
  request and response payloads verbatim. Anything sensitive an agent
  passes through a captured call is stored as-is.
- **No artifact signing.** Tamper-evidence today is the hash chain
  alone; `ExecutionArtifact.signature` is always `null`. A real
  signature (Ed25519 or similar) over the root hash is the natural next
  step for genuine third-party auditability.
- **Client-side search/filter/sort, not a scalable query.** The
  Executions page and the Dashboard's Integrity Summary both operate on
  one fetched page (see [ADR-0008](adr/0008-client-side-search-and-filtering.md)).
  Correct at demo scale, wrong once execution counts grow.
- **No cross-package TypeScript project references.** Packages resolve
  each other through compiled `dist/`, which is why `build` must precede
  `lint`/`typecheck`/`test` (see `architecture.md` §7). A solution-style
  reference graph would be more IDE-friendly and remove that ordering
  requirement.
- **No AuthN/AuthZ.** The API has no authentication. Fine for a local
  demo; a real requirement before any shared deployment.
- **Assistant Mode explainability doesn't exist.** See
  [ADR-0002](adr/0002-dual-mode-explainability.md) — Engineering Mode
  only, by design, for this MVP.
- **No OpenAPI spec.** `docs/api.md` is hand-maintained.

## Near-term next steps

Roughly in priority order for a post-hackathon continuation:

1. A real Masumi client behind `MasumiAdapterPort`, replacing
   `MockMasumiAdapter` — the capture-time wiring (Step 3.8) already
   proves the seam; this is "write the adapter," not "redesign the
   integration point."
2. Artifact signing (closes the "genuinely third-party-auditable" gap).
3. A PostgreSQL `StoragePort` adapter, validated against the existing
   contract suite — the mechanism is already proven interchangeable
   (ADR-0003); this is "write the adapter," not "redesign the port."
4. Redaction/scrubbing policy for Snapshot payloads before export or
   sharing.
5. AuthN/AuthZ and multi-tenancy.
6. A server-side, indexed search index once client-side filtering stops
   being sufficient.
7. TypeScript project references across the workspace.

## Future vision

Sentinel's differentiated bet is that engineering assurance for
autonomous agents should look like infrastructure — OpenTelemetry,
Terraform, a CI system — not like another AI product bolted onto an AI
product. The determinism constraint (no AI in the capture/replay/verify/
explain path) is the thing that makes that bet coherent: a platform
whose job is to make agents verifiable can't itself be a second
unverifiable layer. Everything built so far is downstream of that one
constraint, and everything on this roadmap keeps it.
