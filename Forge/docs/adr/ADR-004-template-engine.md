# ADR-004: Template Engine

## Context

With AI generation restricted to intent/parameters (ADR-003), something
must deterministically turn a template plus parameters into real Aiken
source — auditable and unit-testable with no external tool or network
call involved.

## Decision

A dedicated `IContractTemplateEnginePort`, implemented by a
`contract-templates` package (the "Forge Engine"), owns a small library of
audited Aiken templates with declared parameter schemas and performs
plain, deterministic substitution — no generation logic that could itself
introduce bugs beyond what's already in the audited template text.

## Alternatives Considered

- **An AST-based Aiken code generator.** More powerful for complex future
  parameterization, but a level of engineering investment not justified
  by a single-template MVP.
- **Fold template storage/rendering into `adapter-aiken`.** Rejected to
  keep "talk to the Aiken CLI" separate from "own a curated content
  library" — two concerns with different change cadences.
- **Let the language model fill in template placeholders directly.**
  Reintroduces the exact risk ADR-003 exists to avoid — "fill in this
  field" is still an LLM decision inside the source file.

## Consequences

Adding a new contract category means writing and auditing a new template
by hand, not generating one — a deliberate throughput ceiling that favors
correctness over breadth. The template/parameter-schema pairing is the
seam where the platform's template library grows over time.

**Validated, not just asserted:** the second and third templates
(`nft-minting-royalty`, a real minting policy; `token-vesting`, a
time-gated spend validator) were added without changing `render.ts`,
`ContractTemplateEngineAdapter`'s shape, or anything above the
`contract-templates` package — only a new template file, a registry
entry, and new intent-classifier keywords. The one real constraint this
surfaced: `adapter-ai`'s parameter extractor only fills numeric schema
properties (see `adapter-ai/parameter-extractor.ts`), so each template is
designed with exactly one extractable numeric parameter; every other
value (an address, a duration, a free-form name) uses a documented
default rather than attempting extraction it can't reliably do.
