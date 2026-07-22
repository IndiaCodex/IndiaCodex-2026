# 0005. Compatibility Rules Are Declarative Data, Not Executable Code

## Status

Accepted

## Context

[ADR 0002](0002-deterministic-rule-based-compatibility-engine.md) already established that compatibility conclusions come from rules, not model-based inference. A separate question remains: what *is* a rule, mechanically? The most flexible option would let a Rule Pack contribute arbitrary code — a function that inspects two releases and returns a conclusion. This is tempting because it's maximally expressive: any compatibility semantics an ecosystem could have, arbitrary code can represent.

That flexibility has real costs. Arbitrary code can have side effects, can behave differently on different runs even against identical input (network calls, timing, uninitialized state), and — critically for a plugin boundary that may eventually accept community contributions (see [plugin-architecture.md](../architecture/plugin-architecture.md#what-plugins-are-trusted-to-do)) — arbitrary code is something that has to be trusted or sandboxed, not merely reviewed for correctness.

## Decision

A `Compatibility Rule` is declarative data: a condition expressed as a `Constraint` over two releases' capabilities, versions, and dependencies, plus a fixed conclusion type (`Compatible`, `Incompatible`, `RequiresConstraint`). The Rule Engine interprets this data. Rule Packs never supply executable code that runs as part of evaluation.

## Alternatives Considered

**Arbitrary code rules** (a Rule Pack contributes functions the engine calls). Rejected primarily on reproducibility and trust grounds: a rule expressed as code can, in principle, do anything — including something nondeterministic — which would undermine the reproducibility guarantee the entire product depends on (see [ADR 0002](0002-deterministic-rule-based-compatibility-engine.md)). It also means every rule is a piece of code that has to be trusted at the same level as core application code, foreclosing any future path to accepting rule contributions from people who aren't also trusted with runtime code execution.

**A general-purpose embedded scripting language for rules** (a middle ground: more expressive than pure constraints, sandboxed for safety). Considered and rejected for now as unnecessary complexity — no use case in [use-cases.md](../use-cases.md) has required expressiveness beyond version and capability constraints, and adding a sandboxed scripting runtime is a substantial engineering investment to solve a problem that hasn't been demonstrated yet. If a real ecosystem compatibility rule genuinely can't be expressed as a constraint over versions, capabilities, and dependencies, that's a signal to reopen this decision with a concrete example in hand — not a reason to build the general case speculatively now.

## Consequences

Every rule's evaluation is inherently order-independent and reproducible (see [compatibility-engine.md](../architecture/compatibility-engine.md#rule-engine)), and every rule is inspectable as data — a maintainer or contributor can read a rule pack and know exactly what it checks without executing it. The cost is expressiveness: some hypothetical compatibility semantics might not fit the constraint model cleanly. That tradeoff is accepted deliberately, on the grounds stated above, and is the kind of constraint that should be revisited only against a real, specific case that proves it's too narrow — not loosened preemptively.
