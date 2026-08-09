# Development Guide

## Requirements

- Node.js ≥ 22 (`.nvmrc` pins the exact version this repo is tested against)
- pnpm ≥ 11 (`packageManager` in the root `package.json` pins the exact version)

## First run

```bash
pnpm install
pnpm build       # required — see "Why build first" below
pnpm test
```

## Day-to-day loop

```bash
pnpm dev:server     # tsx watch — apps/server, API on :4000
pnpm dev:web        # vite dev server — apps/web, console on :5173
```

Run both in separate terminals. The web app talks to `http://localhost:4000`
by default; override with `VITE_SENTINEL_API_URL` in `apps/web/.env.local`
if you're running the API elsewhere.

To seed demo data into the dev server's database:

```bash
pnpm seed:demo
```

Safe to re-run — it's idempotent per scenario (skips capture for an
already-sealed/already-captured execution, but still re-runs
replay/verification/explainability/export against it).

## Why build first

`pnpm verify` runs the full pipeline in the right order:

```bash
pnpm verify   # build → lint → typecheck → test
```

Run this — not the individual commands in isolation — before considering
a change done. It's also exactly what CI runs. See
[`architecture.md` §7](architecture.md#7-why-build-precedes-linttypechecktest-in-ci)
for the root cause (no TypeScript project-reference graph yet, so
cross-package imports resolve through compiled `dist/`).

## Testing

```bash
pnpm test              # every package, once
pnpm test:watch        # root vitest in watch mode
pnpm --filter @sentinel/domain test   # one package only
```

**Run the suite more than once before trusting a green result**,
especially after touching anything involving hashes, generated IDs, or
timestamps. This project has hit two real flaky tests from the same root
cause (a test flipping one character of a hash/ID string to a _fixed_
value, which has a small but real chance of producing the _original_
value) — both were only caught by re-running the suite several times in
a row, not by a single pass. If you introduce a test that mutates a
hash/hex string for a "this should now be different" assertion, flip to
a value guaranteed to differ (`char === "0" ? "1" : "0"`), not a fixed
literal.

Test layout: each package's own tests live in its `test/` directory,
using real collaborators (`@sentinel/testkit` fixtures, `InMemoryStorage`
for anything needing a `StoragePort`) rather than mocks — the fixtures
themselves are built on the real domain functions
(`appendJournalEntry`, `sealJournal`), so a fixture and production code
can't silently drift apart.

## Adding a package

1. `mkdir -p packages/<name>/src packages/<name>/test` (or
   `packages/adapters/<name>` for a port implementation).
2. Copy `package.json`, `tsconfig.json`, `tsconfig.build.json`, and
   `vitest.config.ts` from a sibling package (e.g. `packages/explainability`)
   and adjust the name/description/dependencies.
3. Add the new path to `pnpm-workspace.yaml` if it's under a new
   top-level directory pattern (`packages/adapters/*` is already covered).
4. `pnpm install`, then `pnpm --filter @sentinel/<name> run build`.
5. Respect the dependency direction: `packages/domain` depends on
   nothing else in this repo; `packages/application` depends only on
   `domain` and `explainability`; adapters depend on `domain` (for the
   port they implement) plus their external library; apps compose
   everything. `pnpm run verify` won't catch a violation of this by
   itself yet (no enforced lint rule — see `roadmap.md`), so this is a
   code-review discipline for now.

## Conventions

- **Branded IDs at boundaries.** `ExecutionId`, `WorkflowId`, etc. are
  nominal types (`string & { __brand }`). Crossing an untyped boundary
  (an HTTP route param, a raw string from a test) requires
  `parseExecutionId`/`isExecutionId`/etc. from `@sentinel/domain` — never
  a bare `as ExecutionId` cast outside a place that's already validated
  the value.
- **`exactOptionalPropertyTypes` is on.** An optional field must be
  entirely absent when unset, never explicitly `undefined`. This
  occasionally requires an explicit cast at a zod-parsed boundary (zod
  infers optional fields as `T | undefined`, which is wider than what
  this flag wants) — see the comment in
  `packages/application/src/capture/capture-event-use-case.ts` for the
  fully-explained instance.
- **No AI in the deterministic path.** Nothing under `verifyArtifact`,
  `replayArtifact`, or `@sentinel/explainability` may call an LLM or any
  non-deterministic external service, ever. This is a hard architectural
  invariant, not a style preference.
- **Format before committing:** `pnpm format` (Prettier). CI doesn't
  currently gate on `format:check` — running it locally is on you for
  now.

## Repository-wide scripts

| Script                              | What it does                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm build`                        | Builds every workspace package.                                                            |
| `pnpm verify`                       | build → lint → typecheck → test, in that order.                                            |
| `pnpm demo`                         | build → seed all four demo scenarios → run server + web as production builds, one command. |
| `pnpm seed:demo`                    | Seeds demo data into whatever server config is active.                                     |
| `pnpm lint` / `pnpm lint:fix`       | ESLint across the whole workspace.                                                         |
| `pnpm typecheck`                    | `tsc --noEmit` for every package.                                                          |
| `pnpm format` / `pnpm format:check` | Prettier.                                                                                  |
