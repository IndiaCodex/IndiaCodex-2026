# Slide 7 — Engineering Quality

## Title

Built like infrastructure, not a hackathon prototype

## Content

- **171 tests, 28 files, 11 packages** — stable across repeated runs, not a
  single flaky pass
- **Clean Architecture, enforced** — domain layer has zero framework or
  adapter dependencies
- **Contract-tested storage** — one shared test suite validates SQLite and
  in-memory adapters are genuinely interchangeable, not just structurally
  similar
- **9 Architecture Decision Records** — every significant, hard-to-reverse
  decision documented with context, alternatives, and consequences
- **Zero known vulnerabilities** (`pnpm audit`) · **MIT licensed** · full
  CI on every push (build → lint → typecheck → test)

## Speaker Notes

This slide exists to answer "did you actually engineer this, or did you
demo-hack it" without saying either phrase out loud. Pick one concrete
example instead of just reading the stats: "Every SQL query in our storage
layer is parameterized — we checked. The hash chain is SHA-256 over
canonical JSON, so any tampering anywhere in an execution's history changes
the final root hash and gets caught on the next verification, not
discovered later." If time allows, mention the testing discipline: the team
runs the suite multiple times before trusting a green result, because it's
caught two real flaky tests before shipping.

## Visual Suggestions

Four compact stat tiles in the product's own visual language (same card
style as the Dashboard's stat tiles): `171 tests` · `28 files` · `9 ADRs` ·
`0 known vulnerabilities`. Resist the urge to add more than four numbers —
the quality signal is in the specificity, not the quantity.
