---
name: Feature request
about: Propose a new capability or a change in behavior
title: ""
labels: enhancement
assignees: ""
---

## Problem

What's the gap? What can't you do today, or what's awkward?

## Proposed solution

What you'd like to see. If you have a specific API/UI shape in mind, sketch
it — request/response shape, a mockup, a CLI invocation, etc.

## Alternatives considered

Other approaches you thought about, and why you didn't propose them instead.

## How this fits the architecture

Sentinel's non-negotiables (see [`docs/architecture.md`](../../docs/architecture.md)
and [`docs/adr/`](../../docs/adr/)):

- Clean Architecture / Ports & Adapters — domain has zero framework/adapter
  dependencies.
- Determinism — nothing in the capture → replay → verify → explain path may
  call an LLM or any other non-deterministic service.
- No new capability should require touching more than one architectural
  layer's worth of code to add.

If your proposal conflicts with one of these, say so explicitly — it doesn't
disqualify the idea, but it changes how big a discussion it needs before
implementation.

## Additional context

Anything else — related issues, prior art in other tools, etc.
