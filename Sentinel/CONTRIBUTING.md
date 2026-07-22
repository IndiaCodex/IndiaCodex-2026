# Contributing to Sentinel

Sentinel is an engineering-assurance platform for autonomous AI agents,
built with the discipline of infrastructure software: deterministic,
tested, and reviewable. This guide is how to work in it, not why it
exists — see [`README.md`](README.md) and [`docs/vision.md`](docs/vision.md)
for that.

## Before you start

Read [`docs/architecture.md`](docs/architecture.md) and at least the
index of [`docs/adr/`](docs/adr/). The single most important constraint
in this codebase is architectural, not stylistic: **no code path
reachable from Execution Capture, the Execution Journal, Replay,
Verification, or Explainability may call an LLM or any nondeterministic
external service.** A PR that violates this will be rejected regardless
of how well-tested it is.

## Development loop

See [`docs/development.md`](docs/development.md) for setup, the test
loop, and how to add a new package. In short:

```bash
pnpm install
pnpm verify   # build → lint → typecheck → test — run this before every PR
```

## Pull request expectations

- **Every commit leaves the repository in a runnable state.** `pnpm
verify` should pass at each commit in your PR, not just the last one.
- **Tests accompany the change**, in the same package, using real
  collaborators (`@sentinel/testkit` fixtures, `InMemoryStorage`) rather
  than mocks where practical.
- **Run the test suite more than once** before opening the PR,
  especially if your change touches hashing, generated IDs, or
  timestamps — see the flaky-test note in
  [`docs/development.md`](docs/development.md#testing).
- **Respect package boundaries.** `packages/domain` depends on nothing
  else in this repository. `packages/application` depends only on
  `domain` and `explainability`. Adapters depend on `domain` (for the
  port they implement) and their external library. If your change needs
  to violate this, it's very likely the wrong change — open an issue
  first.
- **New architecture gets an ADR.** If your change introduces a new
  concept, port, or reverses an existing decision, add a numbered file
  to `docs/adr/` following the existing format (Context → Decision →
  Alternatives → Consequences). Small additive refinements (a new field,
  a new adapter behind an existing port) don't need one; anything that
  future-you would want the reasoning for does.
- **Format before pushing:** `pnpm format`.

## Reporting issues

Open an issue using the bug report template, including the output of
`pnpm --filter @sentinel/server run seed:demo` if it's related to the demo
pipeline — that's the fastest way to reproduce almost anything in this
codebase, since it exercises the full capture → journal → replay → verify →
explain → export path end to end.

**Security issues are the exception** — see [`SECURITY.md`](SECURITY.md) for
private reporting instead of a public issue.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). In
short: be direct, be kind, assume good faith. Technical disagreements are
resolved by evidence (a failing test, a benchmark, an ADR's stated
tradeoffs) over seniority or volume.
