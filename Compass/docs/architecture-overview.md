# Architecture Overview

## Status

This document describes Compass's conceptual architecture — its layers, boundaries, and the reasoning behind them. It intentionally stops short of implementation detail: no languages, frameworks, class names, or file layouts are specified here. Those decisions come later, as ADRs, once this shape is validated. See [docs/adr/](adr/) for decisions already made and the process for proposing new ones.

The full, locked architecture specification — precise domain model, bounded contexts, module boundaries, the plugin and compatibility-engine designs, API contracts, and every cross-cutting concern — lives in [docs/architecture/](architecture/), with this document as its conceptual entry point.

## Design Constraint

The single constraint every part of this architecture serves: **a compatibility answer must be reproducible and traceable to the data and rules that produced it.** An engineer or a CI pipeline is going to act on Compass's output — proceed with an upgrade, or block a merge. That only works if the same question, asked twice against the same ecosystem state, produces the same answer, and if that answer can be traced back to the specific data and rule responsible for it. This constraint is why the architecture separates *what compatibility means* (a deterministic domain model and rule set) from *where data comes from* and *how answers are delivered* — those two things change constantly; the meaning of compatibility should not have to change with them.

## Layered Shape

```
┌─────────────────────────────────────────────────────────────┐
│  Delivery Surfaces                                           │
│  CLI · GitHub Action · Machine-readable API/export           │
│  (later: hosted dashboard)                                   │
├─────────────────────────────────────────────────────────────┤
│  Query Layer                                                 │
│  Compatibility Matrix · Upgrade Advisor ·                    │
│  Breaking Change Detection · Risk Views                      │
├─────────────────────────────────────────────────────────────┤
│  Domain Core  (framework-independent)                        │
│  Components · Releases · Compatibility Relationships ·       │
│  Compatibility Rule Engine                                   │
├─────────────────────────────────────────────────────────────┤
│  Ingestion Plugins                                            │
│  GitHub metadata · Package registries (npm, Cargo, ...) ·    │
│  Compiler/protocol release feeds · CI result feeds           │
├─────────────────────────────────────────────────────────────┤
│  Ecosystem Sources (external, not owned by Compass)          │
│  Midnight repositories · registries · release channels       │
└─────────────────────────────────────────────────────────────┘
```

Dependencies point downward only. The domain core has no knowledge of where its data came from or how its answers will be displayed; ingestion plugins and delivery surfaces both depend on the domain core, never the reverse. This is what allows a new ecosystem source or a new delivery surface to be added without modifying — or risking — the logic that determines what "compatible" means.

## Domain Core

This is the part of Compass that has to be right, and the part everything else exists to serve.

**Component.** Any independently versioned part of the ecosystem Compass tracks: the protocol, the compiler, an SDK package, the node, the wallet, a template, a downstream application. Components are typed, so rules can distinguish "this is an SDK" from "this is a template" without special-casing individual names.

**Release.** A specific version of a component, carrying whatever declared metadata is available about it: what it depends on, what compiler/protocol version it targets, what changed relative to the previous release.

**Compatibility Relationship.** A statement that release A of component X is (or is not, or is not yet known to be) compatible with release B of component Y, along with the evidence or rule that produced that statement. This is the atomic unit Compass reasons about, and every higher-level query — the matrix, the advisor, breaking-change detection — is a view over a graph of these relationships.

**Compatibility Rule Engine.** Compatibility relationships are derived by evaluating declarative rules against observed release data — semantic version constraints, declared peer dependencies, explicit compatibility declarations from maintainers, and observed CI results where available. The engine is deliberately rule-based rather than model-based: given the same inputs and the same rule set, it must produce the same output, and the reasoning behind any output must be inspectable. This is the direct implementation of the "no magic" principle in [vision.md](vision.md) — there is no capability in this layer whose output cannot be traced to a specific rule and a specific piece of input data.

The domain core is where Clean Architecture boundaries matter most: it depends on nothing outside itself, is fully testable in isolation from any real ecosystem data, and is the only layer whose correctness the rest of the system's trustworthiness depends on.

## Ingestion Plugins

Each Midnight ecosystem source — a GitHub repository, an npm or Cargo registry, a compiler or protocol release channel, a CI result feed — is fed into the domain core through a plugin implementing a common ingestion boundary. Plugins translate source-specific data (a package.json, a Cargo.toml, a GitHub release, a CI run result) into the domain core's vocabulary (components, releases, declared relationships) and nothing more.

This boundary is what makes the plugin architecture real rather than aspirational: adding support for a new source Midnight adopts — a new SDK language, a new registry, a new release channel — means writing a new plugin against a stable interface, not modifying the domain core or any existing plugin. It is also what keeps source-specific mess (inconsistent metadata, missing fields, source outages) contained at the edge of the system instead of leaking into the logic that computes compatibility.

## Query Layer

The query layer answers the specific questions engineers ask, by composing the domain core's graph rather than adding new logic of its own:

- **Compatibility Matrix** — a queryable snapshot of which releases across components are known-compatible, known-incompatible, or unverified
- **Upgrade Advisor** — given a component's current release and a target release, what else in the dependent set needs to move, and what (if anything) is unsafe
- **Breaking Change Detection** — given two releases of a component, what compatibility relationships changed and what depends on the ones that broke
- **Release Health / Ecosystem Risk views** — aggregate signal over the graph: components with disproportionate unresolved incompatibility, stale templates, releases with unusually high downstream breakage

Every query in this layer is answerable purely from the domain core's current graph state plus, where relevant, a specific historical snapshot of it (see Versioned Snapshots, below). None of them require new data collection or new rule logic beyond what ingestion and the rule engine already produce — they are views, not separate subsystems.

## Delivery Surfaces

**CLI.** The baseline interface: local, scriptable, the natural entry point for a developer asking "is this safe" from their terminal, and the foundation the GitHub Action is built on.

**GitHub Action.** The primary driver of continuous, weekly usage: it runs the same queries the CLI exposes, against a pull request's proposed changes, and fails the check when it would introduce ecosystem incompatibility. This is the surface that turns Compass from a tool an engineer has to remember to run into one that runs on their behalf.

**Machine-readable export.** Compatibility data exposed as structured output (not tied to a specific format here) so that other tools — scaffolding generators, dashboards, third-party integrations — can consume it without depending on Compass's own delivery surfaces.

**Hosted dashboard (later).** A visual, always-current view of the compatibility graph for maintainers and adoption/risk reviewers who need the aggregate picture rather than a single query result. Deliberately sequenced after the CLI and Action, because the dashboard's value is entirely derivative of the domain core being correct — building it first would mean building a view onto data that doesn't exist yet.

## Versioned Snapshots

The compatibility graph changes as new releases and new data arrive. Compass retains snapshots of graph state over time rather than only exposing "current," because several of its core questions are inherently historical: *which release introduced this incompatibility* cannot be answered from current state alone. This is a storage and query concern, not a domain modeling concern — the domain core's job is to produce a correct graph at a point in time; retaining and querying across points in time is handled by the layer that persists it.

## Non-Goals

Stated explicitly because they bound the architecture as much as anything above does:

- Compass does not execute, simulate, or interact with contracts, transactions, or chain state. It reasons about released artifacts and their metadata, never runtime behavior.
- Compass does not resolve or install dependencies on a consumer's behalf. It reports on compatibility; package managers remain responsible for resolution.
- Compass does not infer compatibility using machine learning or heuristic scoring. Every relationship in the domain core traces to a declared rule and observed data.
- Compass does not own or gate the release process of any ecosystem component. It observes releases and reports on them; it does not block a component from releasing.

## Why This Shape, Not a Simpler One

The obvious simpler alternative — a single script that checks a hardcoded list of version pairs — was considered and rejected. It fails the moment a new component type, a new ecosystem source, or a new kind of question (advisor vs. matrix vs. breaking-change detection) is needed, at which point it has to be rewritten rather than extended. The layered shape above costs more up front — a real domain model, a plugin boundary, a rule engine — but that cost is what buys the property the [vision](vision.md) depends on: new sources and new questions are additions, not rewrites, and the answers stay traceable to their source data as the ecosystem this system models keeps growing.
