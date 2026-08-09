# Slide 4 — Sentinel Architecture

## Title

Capture → Journal → Replay → Verify → Explain → Export

## Content

- **Capture** — every event (lifecycle, tool, decision, payment) validated
  against a schema and domain invariants through a typed HTTP API
- **Journal** — append-only, hash-chained record; no updates, no deletes,
  ever
- **Replay** — deterministic reconstruction from recorded Snapshots, after
  independent re-verification; never re-invokes a live LLM, tool, API, or
  Masumi
- **Verify** — six independent checks, recomputable from an exported artifact
  alone, no database required
- **Explain** — deterministic, rule-based narration; no AI anywhere in this
  path
- **Export** — one portable, self-contained JSON file

## Speaker Notes

Move fast through the pipeline itself — the point is the shape and the one
hard rule, not each individual box: "No code path in this entire chain is
allowed to call an LLM or any nondeterministic service. That's enforced
structurally, not by convention — the function that writes to the Journal
rejects an event that's missing a required Snapshot, or one that carries one
it shouldn't. The platform that verifies agents cannot itself be a second
unverifiable AI layer." Mention Clean Architecture in one breath: domain
layer has zero framework dependencies, ports and adapters throughout.

## Visual Suggestions

Horizontal six-box pipeline diagram (see
[`docs/diagrams/execution-flow.md`](../docs/diagrams/execution-flow.md) for
the full Mermaid version) — each stage a labeled chip, arrows between them,
last box glowing into a single JSON file icon. Keep box labels to one word
each; let the speaker notes carry the detail.
