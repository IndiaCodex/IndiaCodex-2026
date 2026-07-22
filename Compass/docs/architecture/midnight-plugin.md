# The Midnight Plugin

## Status

This documents `plugins/midnight` — the first real ecosystem plugin built against the architecture in this folder, and the proof that [ADR 0001](../adr/0001-independent-compatibility-domain-model.md)'s central bet holds: everything Midnight-specific lives in this one package, built entirely against the generic `SourceAdapterPort`, `CapabilityExtractorPort`, and `RulePackPort` contracts from [plugin-architecture.md](plugin-architecture.md). Nothing in `core/domain` or `core/application` imports this package, references Midnight, or would need to change if a second ecosystem plugin were added beside it.

## What It Watches

The plugin tracks six real repositories in the `midnightntwrk` GitHub organization, declared explicitly in `plugins/midnight/src/registry.ts` — a deliberate, human-authored fact, not something inferred from a description or topic list (the brief's "no heuristics without evidence" applies to classification too, not only to compatibility conclusions):

| Repository | Component type | Release source |
|---|---|---|
| `midnight-js` | `sdk` | GitHub releases, tag prefix `v` |
| `compact` | `toolchain` | GitHub releases, tag prefix `compactc-v` |
| `midnight-node` | `runtime` | GitHub releases, tag prefix `node-` |
| `example-counter` | `template` | No releases exist for this repo — falls back to `package.json`'s version at the default branch HEAD |
| `midnight-docs` | `documentation` | Neither releases nor a manifest — zero releases, by design |
| `create-mn-app` | `cli` | GitHub releases, tag prefix `v` |

A seventh component, Node.js itself, is modeled without a registry entry at all (`plugins/midnight/src/node-runtime.ts`): it isn't a Midnight repository, but real Midnight `package.json` files declare `"engines": { "node": ">=22" }`, and "minimum supported runtime" is a real compatibility question this plugin needs to answer. Node's own release lines are public, documented fact — modeled as a small, fixed list of well-known versions, not fetched from anywhere.

`example-counter` and `midnight-docs` are kept in the registry specifically because they exercise real, honest edge cases: a repository can be a legitimate, actively-maintained ecosystem component with no GitHub releases at all. The architecture treats that as a fact to represent (a Component can have zero Releases), not an error to work around.

This registry and its fixture data (docs/architecture/midnight-plugin.md's examples throughout this document, and every plugin test) come from real, recorded API responses captured from the live `midnightntwrk` GitHub organization — not fabricated data. See `plugins/midnight/test/fixtures/midnight-ecosystem.fixture.json`.

## Source Adapter

`MidnightSourceAdapter` implements `SourceAdapterPort` against a small `GitHubClient` interface (`plugins/midnight/src/github-client.ts`), with two implementations:

- `RestGitHubClient` — the real GitHub REST API v3 client, used in production.
- `FixtureGitHubClient` (test-only) — replays the recorded fixture, so every test in this plugin runs deterministically with no network access, per the [testing strategy](cross-cutting-concerns.md#testing-strategy)'s "plugins are tested against recorded fixtures, not live calls."

For each registry entry, per ingestion run, it:

1. Fetches repository metadata (`getRepository`) and creates a `Repository` + `Component`.
2. Discovers releases, either from GitHub Releases (filtered and stripped by the configured tag prefix, e.g. `node-2.0.0-rc.4` → `2.0.0-rc.4`) or, when no releases/tags exist, from the `package.json` version at the default branch HEAD.
3. A tag that doesn't parse as a valid version after stripping its prefix is skipped, deterministically — never guessed at. Real example: `compact`'s repository has an older `compact-v0.5.1`-style tag alongside the current `compactc-v0.31.1`-style ones; the configured prefix (`compactc-v`) simply never matches the old naming, so those releases are never discovered at all, without any special-case code.
4. Every discovered release gets `declared-metadata` Evidence citing exactly which GitHub tag or manifest field the fact came from (docs/architecture/compatibility-engine.md#evidence-model).

## Capability Extraction

Two extractors, each handling a different real shape of Midnight ecosystem data:

### `NpmManifestCapabilityExtractor`

Parses a real `package.json`. Only fields every real manifest is guaranteed to carry real, standard meaning for are used — nothing is invented:

- **`name` + `version`** become the release's own "provided" capability. This is what lets another component's declared dependency on that exact package name resolve onto it.
- **`dependencies` / `peerDependencies`** become `Dependency` edges — but only toward components this plugin's registry also tracks (matched by a declared `providedPackageName`). A real dependency on an untracked package (e.g. `chalk`, `commander`) is left alone; Compass has no opinion about packages outside the ecosystem it's asked to watch.
- **`engines.node`** becomes a `Dependency` on the synthetic Node.js component — the most common real "minimum supported runtime" signal in the ecosystem.
- A version range like `workspace:*` (Yarn/npm's monorepo-internal linking protocol) is not a real cross-repository constraint outside that monorepo, so it's deterministically skipped, the same fail-closed discipline governing every other conclusion in this engine.

It also parses a real Compact contract file when the registry declares a `contractPath` (only `example-counter`, currently): every Compact contract begins with a `pragma language_version >= X.Y;` directive — a genuine, load-bearing Compact language feature, not a Compass invention — which becomes a `Dependency` on the `compact` component with a **capability** constraint (`requiresCapability('compact-language', range)`), not a version-range constraint, since it's a requirement on what the compiler *provides*, not on the compiler's own toolchain version.

### `CompactToolchainCapabilityExtractor`

Real `compact` toolchain releases carry two version numbers in one place — the release name itself: `"Compact toolchain 0.31.1 (Compact language 0.23.0)"`. The toolchain version (`0.31.1`) is already the Release's own version, from discovery; the *language* version (`0.23.0`) is the capability contracts declare a requirement against. This extractor parses that embedded string deterministically (a fixed regular expression, no inference) and emits it as a `compact-language` provided capability.

Real data surfaced a genuine, honest limitation here worth naming directly: two tracked `compact` releases (`compactc-v0.28.0`, `compactc-v0.26.0`) predate this naming convention — their release names are just `"Compactc v0.28.0"`, with no embedded language version at all. The extractor correctly produces no `compact-language` capability for those releases, which means a contract's pragma-derived dependency on them is honestly `incompatible` (the capability it requires is provided nowhere), not silently ignored. This is fail-closed behavior working exactly as designed against real ecosystem messiness, not a bug — see the golden ingestion test.

### The "prerelease" marker

Both extractors mark a release whose version carries a prerelease identifier (alpha/beta/rc) with a synthetic `prerelease` capability. This is what the rule pack's advisory rule (below) keys off of — see [ADR 0002](../adr/0002-deterministic-rule-based-compatibility-engine.md) and [ADR 0005](../adr/0005-declarative-rule-model.md) for why this is expressed as ordinary Constraint machinery (`requiresCapability('prerelease')`) rather than a bespoke "is this a prerelease" primitive bolted onto the engine.

## Rule Pack

`MidnightRulePack` is deliberately small — two rules (`plugins/midnight/src/midnight-rule-pack.ts`). This is a direct consequence of [ADR 0011](../adr/0011-declared-dependency-constraints-are-first-class-compatibility-signal.md): most of what a rule pack might otherwise need to encode (SDK version compatibility, minimum runtime version, missing required capabilities) is already handled generically by the engine evaluating a release's own declared `Dependency` constraint — a rule pack exists for genuine ecosystem-wide *policy* that isn't already a specific declared constraint. See [ecosystem-analysis-algorithms.md](ecosystem-analysis-algorithms.md#what-a-rule-pack-is-for-versus-adr-0011) for the full mapping from every requested rule category to the mechanism that actually answers it.

- **`midnight-prerelease-advisory`** — fires (`requires-constraint`, not `incompatible`) whenever a dependency's target release carries the `prerelease` marker. A prerelease dependency is often used deliberately; this flags it for a second look rather than blocking it outright.
- **`midnight-stable-release`** — the mirror image: a release with no prerelease marker is, on its own and with no other information, an unremarkable `compatible` baseline. This exists specifically for pairs with no declared `Dependency` at all (e.g. an Upgrade Advisor query about adopting a component for the first time), where ADR 0011's mechanism has nothing to evaluate and the result would otherwise default to `unverified` forever.

Both rules pass the shared conformance suite from [plugin-architecture.md](plugin-architecture.md#conformance-not-trust-by-convention) (`checkRulePackConformance`), same as any other rule pack would have to.

## What Is Explicitly Not Modeled Yet

Stated directly, matching this project's habit of naming scope boundaries rather than leaving them implicit:

- **Only one component per repository.** `midnight-js` is a real Yarn monorepo with over a dozen sub-packages under `packages/*`; this plugin tracks exactly one of them (`packages/midnight-js/package.json`, the public barrel package), configured explicitly via `manifestPath`. Modeling every sub-package as its own Component is a natural, additive extension — deferred, not designed around, until a real use case needs it.
- **No Rust/Cargo manifest parsing.** `midnight-node` (a Substrate/Rust node) has `extractorKind: 'none'` — its releases and versions are tracked, but no capability/dependency extraction runs against it. A `CargoManifestCapabilityExtractor` would be the natural addition, built the same way the npm one was, when a real Rust-side compatibility question needs answering.
- **No transitive, multi-hop dependency resolution.** Every compatibility check here is one hop: does this release satisfy that release's declared constraint. Multi-hop questions ("what's the full upgrade order across five components") are explicitly deferred — see [ecosystem-analysis-algorithms.md](ecosystem-analysis-algorithms.md#what-is-deliberately-not-solved-here).
