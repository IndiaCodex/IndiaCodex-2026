# 0010. Implementation Stack: TypeScript, npm Workspaces, Vitest, better-sqlite3

## Status

Accepted

## Context

[docs/architecture/README.md](../architecture/README.md) deliberately named no language, framework, or database, on the grounds that a specification which can only be read as "the design of a service in language X" hasn't actually proven its independence from implementation. That test is now complete — the specification held up without needing a language to make sense. Implementation has to pick one.

The relevant constraints: the Midnight ecosystem's own SDKs are TypeScript/JavaScript, as is the GitHub Actions ecosystem the [GitHub Action interface](../architecture/interfaces.md#github-action) will eventually target and the Dashboard will eventually run in. The [testing strategy](../architecture/cross-cutting-concerns.md#testing-strategy) calls for property-based testing of the Rule Engine and fast, isolated unit tests everywhere. The [storage architecture](../architecture/knowledge-graph.md#the-first-adapter-should-be-the-simplest-thing-that-works) calls for the simplest adapter that satisfies the port, at v1 scale. The [repository structure](../architecture/repository-structure.md) requires a dependency-direction rule enforceable in CI, independent of whatever the language's own module system does or doesn't check.

## Decision

- **Language/runtime:** TypeScript on Node.js (LTS), compiled with project references (`tsc -b`) so each package only builds against the packages it explicitly declares as a dependency. Pinned to the latest TypeScript 5.x (not the newly released 7.x line) because `typescript-eslint`'s declared peer range did not yet cover 7.x at the time of this decision — a live instance of exactly the cross-tool compatibility mismatch this project exists to catch, resolved the same way Compass would recommend: pick the version combination the ecosystem actually declares as compatible, not the newest one in isolation.
- **Workspace tool:** npm workspaces. No additional package manager to install — `npm install` at the root is the entire setup step, which matters directly for the "suitable for open-source contributors" objective ([architecture/README.md](../architecture/README.md)).
- **Test runner:** Vitest, with `@vitest/coverage-v8` for coverage and `fast-check` for property-based tests of the Rule Engine's rule-interaction behavior (see [ADR 0005](0005-declarative-rule-model.md)).
- **Boundary enforcement:** `dependency-cruiser`, configured directly from the dependency graph in [repository-structure.md](../architecture/repository-structure.md#dependency-rules), run as a required CI check — this is the literal implementation of [ADR 0003](0003-clean-architecture-with-enforced-dependency-rule.md)'s enforcement requirement.
- **Storage adapter:** `better-sqlite3` for the SQLite adapter — synchronous, widely used in production Node tooling, with prebuilt binaries for common platforms so it doesn't impose a native-toolchain requirement on most contributors.

## Alternatives Considered

**Node's built-in `node:sqlite`**, which would mean zero additional dependency for the SQLite adapter. Rejected for now because it ships marked experimental as of this decision, and the SQLite adapter is meant to be an unremarkable, boring piece of infrastructure (see [ADR 0008](0008-simplest-storage-adapter-first.md)) — building it on an API whose shape could still change is the wrong kind of risk to take on for something that isn't the interesting part of this system. Worth revisiting once the API stabilizes.

**pnpm instead of npm workspaces**, for its stricter dependency isolation (a package genuinely cannot resolve an undeclared dependency, which would double up the boundary guarantee `dependency-cruiser` already provides). Rejected because it adds a required tool beyond what Node ships with, for a guarantee `dependency-cruiser` already delivers at the source-import level — the stricter node_modules isolation would be a second, mostly redundant enforcement mechanism at the cost of contributor friction.

**A monolithic package instead of a multi-package workspace.** Rejected outright — it would silently undo the module boundaries [ADR 0003](0003-clean-architecture-with-enforced-dependency-rule.md) exists to make structural rather than conventional. A single `tsconfig`/`package.json` cannot express "this package may not import that one."

## Consequences

Contributors need only Node and npm to build, test, and lint the entire repository. The dependency graph declared in [repository-structure.md](../architecture/repository-structure.md) is now enforced twice over: once by TypeScript project references (a package cannot even compile against an undeclared reference) and once by `dependency-cruiser` (which checks the rule directly against the intended graph, independent of what references happen to be wired up). The `better-sqlite3` choice is revisited if `node:sqlite` stabilizes and the project is willing to absorb a breaking migration for a marginal dependency-count reduction — not before.
