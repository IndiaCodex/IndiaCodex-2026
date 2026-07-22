# Architecture Decision Records

This directory records the significant architectural and product decisions behind Midnight Compass — not just what was decided, but the reasoning and the alternatives that were rejected. The goal is that someone joining later, or reconsidering a decision under new information, can see why things are the way they are without having to reconstruct it from a conversation history that no longer exists.

## When to Write One

Write an ADR when a decision would be expensive to silently reverse, or when a reasonable engineer looking at the codebase or docs later might ask "why was it done this way instead of the obvious alternative." Not every decision needs one — routine implementation choices don't. Decisions that shape [architecture-overview.md](../architecture-overview.md), change [roadmap.md](../roadmap.md) sequencing, or narrow scope described in [vision.md](../vision.md) do.

## Format

Each ADR is a single Markdown file named `NNNN-short-descriptive-title.md`, numbered sequentially, using [template.md](template.md) as the starting structure:

- **Status** — Proposed, Accepted, Superseded, or Deprecated
- **Context** — the problem or forces at play, stated neutrally, without presupposing the decision
- **Decision** — what was decided, stated plainly
- **Consequences** — what this makes easier, what it makes harder, and what it forecloses

## Lifecycle

ADRs are not edited to reflect new decisions — they're superseded. If a later decision changes or reverses an earlier one, the earlier ADR's status is updated to `Superseded by NNNN`, and the new ADR explains what changed and why. The history stays intact; nothing is rewritten to look like it was always the plan.

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-independent-compatibility-domain-model.md) | An Independent Domain Model Scoped Strictly to Compatibility | Accepted |
| [0002](0002-deterministic-rule-based-compatibility-engine.md) | Deterministic, Rule-Based Compatibility Engine (Not ML-Based) | Accepted |
| [0003](0003-clean-architecture-with-enforced-dependency-rule.md) | Clean Architecture with an Enforced, CI-Checked Dependency Rule | Accepted |
| [0004](0004-three-extension-point-plugin-model.md) | A Three-Extension-Point Plugin Model with Explicit Registration | Accepted |
| [0005](0005-declarative-rule-model.md) | Compatibility Rules Are Declarative Data, Not Executable Code | Accepted |
| [0006](0006-evidence-mandatory-fail-closed.md) | Evidence Is Mandatory; Absence of Data Resolves to Unverified, Never Compatible | Accepted |
| [0007](0007-versioned-immutable-snapshots.md) | The Knowledge Graph Is a Sequence of Immutable Snapshots, Not a Single Mutable State | Accepted |
| [0008](0008-simplest-storage-adapter-first.md) | The First Storage Adapter Is the Simplest Implementation That Satisfies the Port | Accepted |
| [0009](0009-dashboard-uses-public-api.md) | The Dashboard Is a Client of the Public Query API, With No Private Access to the Core | Accepted |
| [0010](0010-implementation-stack.md) | Implementation Stack: TypeScript, npm Workspaces, Vitest, better-sqlite3 | Accepted |
| [0011](0011-declared-dependency-constraints-are-first-class-compatibility-signal.md) | A Release's Own Declared Dependency Constraint Is a First-Class Compatibility Signal | Accepted |
| [0012](0012-interfaces-ingest-fresh-per-invocation.md) | Interfaces Ingest a Fresh Snapshot Per Invocation, Until a Persistent Snapshot Service Exists | Accepted |
