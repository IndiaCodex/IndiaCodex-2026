# Architecture Validation — RC1

A point-in-time verification pass, not a design document — `docs/architecture.md`
is the design; this file records what was actually checked, how, and what
was found. Every claim below was verified against the current source tree,
not asserted from memory.

## Method

Ran directly against the source (not inferred from documentation):

- `grep` sweeps for cross-package import statements at every claimed
  boundary, distinguishing real `import`/`from` statements from doc
  comments that merely _mention_ another package's name.
- [`madge`](https://github.com/pahen/madge) `--circular` against
  `packages/domain/src`, `packages/application/src`, and `apps/web/src`
  for internal cyclic-import detection.
- Manual inspection of every port interface in `packages/domain/src/ports/`
  for leaked adapter-specific types.
- Cross-check of every package's `package.json` `dependencies` field
  against the dependency direction `docs/architecture.md` §1 claims.

## Findings

### 1. Clean Architecture boundaries — ✅ holds

`packages/domain/src` contains zero `import ... from "@sentinel/..."`
statements. The only hits for `@sentinel/` inside `packages/domain/src`
are inside doc comments (e.g. a comment in
`engineering-explainability-report.ts` naming `@sentinel/explainability`
as the package that _implements_ the type defined there — correct
Clean-Architecture layering: the type lives in domain, the generation
logic lives in a separate package).

### 2. Dependency direction — ✅ holds

Verified against actual `package.json` `dependencies` fields, not
`docs/architecture.md`'s prose description of them:

| Package                       | Declared dependencies                                                                                                                         | Matches documented direction?                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `@sentinel/domain`            | _(none)_                                                                                                                                      | ✅                                                       |
| `@sentinel/application`       | `domain`, `explainability`, `zod`                                                                                                             | ✅                                                       |
| `@sentinel/execution-journal` | `domain`                                                                                                                                      | ✅                                                       |
| `@sentinel/explainability`    | `domain`                                                                                                                                      | ✅                                                       |
| Every `packages/adapters/*`   | `domain` (+ its external library)                                                                                                             | ✅                                                       |
| `apps/server`                 | `domain`, `application`, `execution-journal`, `export-json`, `storage-memory`, `storage-sqlite`, `adapter-masumi`, `fastify`, `@fastify/cors` | ✅ (composition root — expected to depend on everything) |
| `apps/web`                    | `domain` (types only, see below)                                                                                                              | ✅                                                       |

One correction made during this pass: `apps/server` declared a direct
dependency on `@sentinel/explainability` that nothing in `apps/server/src`
or `apps/server/test` actually imports — it's consumed transitively
through `@sentinel/application`'s re-export. Removed; verified the full
build/lint/typecheck/test pipeline still passes with it gone.

### 3. No cyclic dependencies — ✅ holds

`madge --circular` reports zero circular dependencies within
`packages/domain/src` (31 files), `packages/application/src` (40 files),
and `apps/web/src` (88 files). Combined with the directional grep sweep
above (nothing downstream imports back upstream — e.g. `explainability`
and `execution-journal` do not import `application`, and nothing under
`packages/` imports from `apps/`), there is no cycle anywhere in the
dependency graph, monorepo-wide.

### 4. No leaking abstractions — ✅ holds, one doc-comment correction made

Inspected every interface in `packages/domain/src/ports/`
(`StoragePort`, `ExecutionJournalPort`, `MasumiAdapterPort`, `ExportPort`).
None reference a concrete adapter type, a SQL type, an HTTP type, or any
other implementation-specific shape — every method signature is built
entirely from domain types (`Execution`, `JournalEntry`,
`ExecutionArtifact`, branded identity types).

Found and fixed one inaccurate doc comment while checking this:
`StoragePort`'s own comment claimed it was "implemented by interchangeable
SQLite and PostgreSQL adapters" — no PostgreSQL adapter exists yet; it's a
roadmap item. This wasn't a leaking abstraction, but it was documentation
asserting an abstraction was proven interchangeable across three
implementations when only two exist. Corrected to state current reality
and roadmap status separately.

### 5. No adapter coupling — ✅ holds

Grepped every file under `packages/adapters/*/src` for imports of another
adapter package (`@sentinel/adapter-masumi`, `@sentinel/storage-sqlite`,
`@sentinel/storage-memory`, `@sentinel/export-json`). Zero real import
statements — the only matches are doc comments referencing the shared
`StoragePort` contract suite by name (`storage-sqlite`'s comment noting it
reuses `storage-memory`'s contract tests, which is a test-time-only,
`devDependency`-scoped relationship, not a source-level coupling).

### 6. No framework leakage — ✅ holds

Grepped `packages/domain/src` and `packages/application/src` for imports
of `fastify`, `@fastify/*`, `react`, `better-sqlite3`, `vite`,
`@tanstack/*`, and `react-router`. Zero hits. `apps/web` imports
`@sentinel/domain` for its pure string-literal union types only (verified
in the Step 3.8 pass and re-confirmed here) — it never imports domain's
runtime functions, and it never imports another package's adapter
directly; all server communication is over HTTP.

## Verification

`pnpm run verify` (build → lint → typecheck → test) passes clean after
every change made during this pass, including the `apps/server`
dependency removal. 171 tests, 28 files, unchanged pass count — the
architecture fixes were dependency-graph and comment corrections only, no
behavior changed.

## What this pass does not cover

This validates _structure_ (who is allowed to import whom), not runtime
behavior under load, not the concurrency gap already tracked in
`docs/roadmap.md`, and not a full unused-export audit of every package's
public surface (candidates were identified during the RC1 repository audit
but deliberately not removed — see `CHANGELOG.md` and
`FINAL_RELEASE_REPORT.md` — since trimming public API surface is a
SemVer-relevant decision, not a structural cleanup, and out of scope for
"do not change public APIs unless required to fix a bug").
