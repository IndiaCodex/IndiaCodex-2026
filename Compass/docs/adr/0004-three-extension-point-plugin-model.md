# 0004. A Three-Extension-Point Plugin Model with Explicit Registration

## Status

Accepted

## Context

Given [ADR 0001](0001-independent-compatibility-domain-model.md) and [ADR 0003](0003-clean-architecture-with-enforced-dependency-rule.md), ecosystem-specific knowledge has to enter the system somewhere. That "somewhere" needs to be one well-defined shape, not an ad hoc set of hooks that grows however each new ecosystem happens to need it — otherwise the plugin boundary becomes exactly the kind of implicit, undocumented contract this project's design principles reject.

There's also a temptation, common in plugin systems, toward dynamic discovery: scan a directory or a package namespace at startup and auto-load whatever's found. This is convenient, but it means the set of active plugins — and therefore the data behind any given compatibility answer — is not fully knowable from configuration alone.

## Decision

A plugin implements up to three independent contracts, defined in `plugins/plugin-sdk`: a **Source Adapter** (discovers releases and yields normalized entities + Evidence), a **Capability Extractor** (parses ecosystem-specific metadata into `Capability`/`Constraint`), and a **Rule Pack** (declares ecosystem-specific `Compatibility Rule`s). See [plugin-architecture.md](../architecture/plugin-architecture.md).

Plugins are registered explicitly, by name, in configuration at each interface's composition root. There is no filesystem scanning or automatic plugin discovery.

## Alternatives Considered

**A single, monolithic plugin interface** covering discovery, extraction, and rules as one contract. Rejected because the three concerns have genuinely different shapes and different failure modes — a source being unreachable is a different problem from a manifest failing to parse, which is a different problem again from a malformed rule — and a single interface would force every plugin to implement all three even when it only has something to say about one (a plugin might supply only a Rule Pack for an ecosystem another plugin already ingests, for instance).

**Dynamic plugin discovery.** Rejected on the same "no magic, no hidden behavior" grounds that govern configuration elsewhere in this architecture (see [cross-cutting-concerns.md](../architecture/cross-cutting-concerns.md#configuration-model)): what data feeds a compatibility answer must be knowable by reading a config file, not by tracing what happened to be installed on a given machine at evaluation time. This also closes off a real supply-chain risk — silently auto-loading anything found in a given namespace is a well-known vector for running unintended code.

## Consequences

Adding support for a new ecosystem source, a new manifest format, or new compatibility semantics is additive — a new module implementing one of three known contracts, registered explicitly — never a change to `core/`. The cost is that a plugin author has three contracts to learn instead of one ambient hook to bolt onto; this is accepted because the alternative makes the plugin boundary implicit exactly where this architecture needs it to be explicit.
