# Plugin Architecture

## First Principle

Compass's core never hardcodes Midnight, or any other ecosystem. The core understands `Component`, `Release`, `Dependency`, `Package`, `Runtime`, `Capability`, `Compatibility Rule`, `Constraint`, `Breaking Change`, `Artifact`, `Evidence`, `Risk`, and `Recommendation` — see [domain-model.md](domain-model.md) — and nothing about GitHub, npm, Cargo, or Midnight's compiler. An ecosystem plugin's job is to supply instances of those types. If Compass ever reasons about a second ecosystem, that's a new plugin, not a redesign — see [ADR 0001](../adr/0001-independent-compatibility-domain-model.md).

## Three Extension Points

A plugin implements up to three independent contracts, defined in `plugins/plugin-sdk` (see [repository-structure.md](repository-structure.md)). A plugin can implement any subset, but a complete ecosystem plugin — like the first-party Midnight plugin — typically implements all three.

### Source Adapter

Discovers and fetches raw data from wherever an ecosystem's components actually live — a GitHub organization, a package registry, a release feed — and yields normalized `Component`, `Release`, `Artifact`, and `Dependency` instances, each accompanied by the `Evidence` documenting exactly where the fact came from.

A Source Adapter does not decide what's *compatible*. It only asserts what *exists* and what was *declared*. That separation is what keeps ingestion swappable independently of compatibility logic: a new way of discovering releases (say, Midnight adds a new registry) is a new or modified Source Adapter, never a change to how compatibility gets evaluated.

### Capability Extractor

Parses ecosystem-specific artifact metadata — a manifest file, compiler output, a protocol descriptor — into normalized `Capability` and `Constraint` objects the Rule Engine can reason about. This is where ecosystem-specific file formats and conventions get translated into the core's vocabulary; nothing downstream of this ever needs to know what a Midnight manifest looks like.

### Rule Pack

A declarative set of `Compatibility Rule` definitions expressing an ecosystem's own compatibility semantics — for example, that a given SDK major version requires a given runtime major version, or that a capability introduced in one release is required by releases of a dependent component after a certain point. Rule Packs are ecosystem knowledge, not engine behavior: the [Rule Engine](compatibility-engine.md#rule-engine) evaluates rules; it does not know what any individual rule says. Rules are declarative expressions, not arbitrary code — see [ADR 0005](../adr/0005-declarative-rule-model.md).

## Registration Is Explicit

Compass does not scan the filesystem or a package registry looking for plugins to auto-load. Every interface's composition root ([repository-structure.md](repository-structure.md)) explicitly registers which plugins are active, by name, in configuration (see [cross-cutting-concerns.md](cross-cutting-concerns.md#configuration-model)). This is a direct consequence of the "no magic, no hidden behavior" principle carried over from [vision.md](../vision.md): what data feeds a compatibility answer should be knowable by reading a config file, not by tracing what happened to be discoverable on a given machine at runtime.

## Plugin Versioning

`plugins/plugin-sdk` exposes a versioned contract. A plugin declares which version of the contract it implements, so the core can evolve the plugin interface over time — adding a new capability to `Source Adapter`, for instance — without silently breaking existing plugins that haven't been updated yet. This is Compass applying its own discipline to itself: the relationship between the core and a plugin is exactly the kind of producer/consumer compatibility question Compass exists to answer for the rest of the ecosystem, so it is governed with the same explicitness — a declared, checkable version contract, not an implicit assumption that "the plugin still works."

## Conformance, Not Trust by Convention

Every plugin, first-party or third-party, must pass a shared conformance test suite distributed with `plugins/plugin-sdk` before it can be registered. The suite verifies structural guarantees the core relies on — that a Source Adapter never yields a `Release` without a `Component`, that `Evidence` is always attached to whatever it claims to support, that a Rule Pack's rules are well-formed constraint expressions rather than something the Rule Engine would fail to evaluate deterministically. This is what lets `core/application` trust *any* registered plugin's output without special-casing "the Midnight one specifically."

## Extension Points

A quick reference for contributors, mapping "I want to do X" to what to implement:

| I want to... | I implement | I depend on |
|---|---|---|
| Support a new way of discovering an ecosystem's releases | A `Source Adapter` | `plugin-sdk`, `core/domain` |
| Support a new manifest or metadata format | A `Capability Extractor` | `plugin-sdk`, `core/domain` |
| Add or change ecosystem-specific compatibility semantics | A `Rule Pack` entry | `plugin-sdk`, `core/domain` |
| Add a new storage backend | A `SnapshotRepository` adapter | `storage-sdk`, `core/application` |
| Add a new way of consuming compatibility answers | A new `interfaces/*` module | `core/application` |

None of these require a change to `core/domain` or `core/application`. If a contribution seems to require one, that's a signal the domain model may be missing a concept — see the closing note in [domain-model.md](domain-model.md) — not a reason to special-case the new requirement inside the core.

## What Plugins Are Trusted to Do

A plugin's Source Adapter and Capability Extractor run arbitrary code to talk to real external systems — that's unavoidable if ingestion is going to reach a real GitHub API or a real registry. A Rule Pack, by contrast, is declarative data the Rule Engine interprets, not code the system executes — a Rule Pack cannot perform I/O, and a broken or malicious rule can produce a wrong compatibility conclusion but cannot compromise the process evaluating it. This distinction is what makes it plausible, later, to accept community-contributed Rule Packs without accepting community-contributed code into the evaluation path. First-party ingestion and extraction code is reviewed the way any dependency in the codebase is; a broader third-party plugin trust and distribution model is future work, addressed when it's needed rather than designed speculatively now (see [roadmap.md](../roadmap.md)).
