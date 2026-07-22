# Slide 6 — Masumi Integration

## Title

Not a mock bolted on. A live call, every payment.

## Content

- `CaptureEventUseCase` calls `MasumiAdapterPort.enrichPayment()` **during
  capture** — not at read time, not in a batch job afterward
- Visible in the terminal the moment you run `pnpm demo`:
  `payment/completed — enriched via MasumiAdapterPort (masumiReference=...)`
- Visible in the UI: a dedicated **Masumi Reference** column in the
  Explainability tab's Payment Flow table — attached even to a _declined_
  payment
- A rejected Masumi call degrades gracefully — capture is never blocked on
  Masumi being reachable ([ADR-0009](../docs/adr/0009-live-masumi-enrichment-at-capture.md))

## Speaker Notes

This is the slide that answers "is your Masumi integration real" before
anyone has to ask it as a hostile question. Be specific: "`MasumiAdapterPort`
is a real port with a real call site in the capture pipeline, exercised on
every single demo run — not a hardcoded string in a fixture. Today it's
backed by a mock adapter with a deterministic settlement algorithm; a real
Masumi client is a drop-in replacement behind the exact same port, the same
relationship SQLite has today to a future Postgres adapter." If a judge
pushes on "mock vs. real," say precisely that distinction — the seam is
real, the concrete client behind it is what's mocked, and name it as a
roadmap item rather than dodging.

## Visual Suggestions

Split screen: left half a terminal screenshot showing the "enriched via
MasumiAdapterPort" line; right half the Explainability Payment Flow table
with the same reference value highlighted in the accent color. This single
image is the strongest evidence in the whole deck — give it the most screen
time of any slide.
