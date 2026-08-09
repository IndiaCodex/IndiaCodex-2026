# Contributing to Midnight Compass

Thank you for considering a contribution. This document is short on purpose — the architecture itself is the real onboarding material, and it's already written down.

## Before You Start

Read, in order:

1. [docs/vision.md](docs/vision.md) and [docs/architecture-overview.md](docs/architecture-overview.md) — what Compass is and isn't.
2. [docs/adr/](docs/adr/) — why the codebase looks the way it does. If a change you're considering would contradict an accepted ADR, open an issue to discuss it before writing code; don't just work around it.
3. [docs/architecture/repository-structure.md](docs/architecture/repository-structure.md) — the module boundaries and the dependency rule `npm run boundaries` enforces in CI.

## Ground Rules

- **Clean Architecture is not negotiable.** `core/domain` depends on nothing. `core/application` depends only on `core/domain`. Plugins, storage adapters, and interfaces depend inward through ports, never the reverse. `npm run boundaries` fails the build if this is violated — that's deliberate, not a false positive to work around.
- **No compatibility logic outside `core/`.** A CLI command, an Action, or a future dashboard translates input into a `core/application` use case call and translates the result back — nothing more. If you find yourself computing a compatibility verdict inside `interfaces/`, that logic belongs in `core/application` instead.
- **Everything is deterministic.** No LLMs, no heuristics without evidence, no non-deterministic ordering. Given the same inputs, every function in this repository returns the same output every time — see [ADR 0002](docs/adr/0002-deterministic-rule-based-compatibility-engine.md) and [ADR 0006](docs/adr/0006-evidence-mandatory-fail-closed.md).
- **Tests use real fakes, not mocking libraries.** `@compass/testing` provides builders and fakes for every port; use them. New plugins and storage adapters must pass the relevant conformance suite (`checkSourceAdapterConformance`, `checkSnapshotRepositoryConformance`, etc.) in addition to their own tests.

## Adding a New Ecosystem Plugin

The extension points are fixed: `SourceAdapterPort`, `CapabilityExtractorPort`, `RulePackPort` (see [docs/architecture/plugin-architecture.md](docs/architecture/plugin-architecture.md)). A new plugin is a new `plugins/<name>` package implementing these against real data from that ecosystem — `plugins/midnight` is the reference implementation to follow, including its fixture-based test strategy ([docs/midnight-plugin.md](docs/architecture/midnight-plugin.md)).

## Adding a New Interface

A new module under `interfaces/`, its own composition root, calls against existing `core/application` use cases, rendering through `interfaces/reporting` if the output is Markdown/HTML. See [docs/architecture/interfaces.md](docs/architecture/interfaces.md#what-a-new-interface-looks-like).

## Development Loop

```bash
npm install
npm run build       # tsc project references
npm run lint         # eslint
npm run boundaries    # dependency-cruiser
npm run test:coverage
npm run ci            # all of the above, in order — what CI runs
```

Every new package needs comprehensive tests; coverage should not go down. Run `npm run ci` before opening a pull request — it's exactly what CI checks.

## Commit and PR Style

Meaningful, scoped commits. A PR description should explain *why*, not just *what* — the codebase already shows what changed; it can't show why you made the call you made. If the change touches an existing ADR's premise, update or supersede that ADR in the same PR rather than leaving the doc to drift from the code.

## Reporting Issues

Open a GitHub issue. For a suspected security vulnerability, see [SECURITY.md](SECURITY.md) instead — do not open a public issue.
