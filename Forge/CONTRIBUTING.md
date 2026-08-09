# Contributing to Forge

Thanks for considering a contribution. This document covers local setup,
the review bar for different parts of the codebase, and how to propose a
non-trivial change.

## Local setup

Requirements: Node.js ≥ 22.13, [pnpm](https://pnpm.io) (`corepack enable`
picks up the pinned version automatically).

```bash
git clone <this-repo>
cd forge
pnpm install
pnpm build
pnpm test              # fast suite — fully offline, a few seconds
pnpm test:integration   # real Aiken compiler + real network — under a minute
```

Before opening a PR:

```bash
pnpm format:check
pnpm lint
pnpm build
pnpm test
```

A pre-commit hook (Husky + lint-staged) runs ESLint and Prettier on
staged files automatically.

## Project structure

This is a pnpm monorepo under Clean Architecture. Read
[`docs/Architecture.md`](docs/Architecture.md) and the six records in
[`docs/adr/`](docs/adr/) before making a structural change — they explain
_why_ the boundaries are where they are, which is usually the fastest way
to figure out where new code belongs.

The short version: `domain` has zero dependencies; `application` depends
only on `domain` and defines ports (interfaces) that adapters implement;
every adapter package (`adapter-aiken`, `adapter-emulator`, etc.)
implements exactly the port(s) it's named for and never depends on
another adapter; `platform-sdk` composes everything into the `Forge`
facade; `cli` depends only on `platform-sdk` and contains no business
logic of its own.

## Review bar by package

Changes to `domain`, `plugin-api`, or `application` affect every adapter
and the plugin contract itself — these get the highest scrutiny, and a
change to the plugin API surface (`ForgePlugin`, `PluginContext`, a
port's method signatures) should be discussed in an issue before a PR,
not after. Changes to an individual adapter, or to `cli`, are lower-risk
and reviewed accordingly.

## Adding a new port implementation (a new adapter)

1. The port itself must already exist in `packages/application/src/ports/`.
   If it doesn't, that's a structural change — open an issue first.
2. Create `packages/adapter-<name>/` following an existing adapter's
   shape: `package.json`, `tsconfig.json` (with project references to
   `domain`/`plugin-api`/`application`), a class implementing the port, a
   `plugin.ts` exporting `create<Name>Plugin(): ForgePlugin`, and an
   `index.ts` barrel.
3. Add the new package's `tsconfig.json` path to the root `tsconfig.json`'s
   `references` array.
4. Write real unit tests. If your adapter wraps a real external tool
   (like `adapter-aiken` wraps the Aiken compiler), keep fast fixture-based
   tests in `*.test.ts` and put anything that needs real network/binary
   access in a separate `*.integration.test.ts` — the root
   `vitest.config.ts` excludes those from the default `pnpm test` run by
   design; they run via `pnpm test:integration`.
5. Add a `README.md` to the new package (every package has one).

## Adding a new contract template

Templates live in `packages/contract-templates/src/templates/`. Per
[ADR-004](docs/adr/ADR-004-template-engine.md), a template is hand-written
and hand-audited Aiken source with `{{placeholder}}` substitutions for
its declared parameters — there is no generator for this; adding a
template means writing and reviewing real Aiken code, then verifying it
compiles with the real `aiken` binary before opening a PR, the same way
all three shipped templates (`escrow-milestone`, `nft-minting-royalty`,
`token-vesting`) were built — see
[`docs/DevelopmentProgress.md`](docs/DevelopmentProgress.md) for each
one's own entry. In practice: only one parameter per template is ever
extracted from natural language (`adapter-ai`'s extractor only fills
numeric schema properties — see
[`packages/adapter-ai/src/parameter-extractor.ts`](packages/adapter-ai/src/parameter-extractor.ts)),
so design every other parameter around a sensible, documented default,
and add a matching intent-classifier keyword list in
[`packages/adapter-ai/src/intent-classifier.ts`](packages/adapter-ai/src/intent-classifier.ts).

## Proposing a larger change

For anything that touches `domain`, `plugin-api`, `application`, or adds
a new package, open an issue describing the problem and your proposed
approach before writing code. For architecture-level decisions, consider
whether it warrants a new ADR in `docs/adr/` (see the existing six for
the expected shape: Context, Decision, Alternatives Considered,
Consequences — kept short, not a design essay).

## Commit messages and PRs

Conventional, descriptive commit messages are appreciated but not
enforced by tooling. Keep PRs scoped to one concern. CI runs
`format:check`, `lint`, `build`, and `test` on every PR; `test:integration`
is not yet wired into CI (it needs network access) and should be run
locally before submitting a change to an adapter that touches a real
external tool.

## Code of conduct

Participation in this project is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md).
