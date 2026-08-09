# Support

## Getting help

1. **Read the docs first** — most questions about how Sentinel works are
   already answered in [`docs/architecture.md`](docs/architecture.md),
   [`docs/api.md`](docs/api.md), [`docs/development.md`](docs/development.md),
   or one of the [Architecture Decision Records](docs/adr/). The
   [`docs/roadmap.md`](docs/roadmap.md) "Known limitations" section also
   answers a lot of "does Sentinel do X" questions directly.
2. **Search existing issues** before opening a new one — someone may have
   already asked, and there may already be an answer or a workaround.
3. **Open an issue** using the bug report or feature request template for
   anything not covered above. Include your Node/pnpm version and, if
   relevant, the output of `pnpm --filter @sentinel/server run seed:demo` —
   that's the fastest way to reproduce most problems in this codebase.

## Response expectations

Sentinel is maintained on a best-effort basis. There's no SLA. Security
reports are the exception — see [`SECURITY.md`](SECURITY.md) for how those
are handled and reported privately.

## What's out of scope for support requests

Questions that are really feature requests for something explicitly listed
as a known limitation (no auth, no rate limiting, no artifact signing —
see [`docs/roadmap.md`](docs/roadmap.md)) don't need a support issue; the
roadmap already tracks them. Open a discussion instead if you want to talk
through priority or offer to help build one.
