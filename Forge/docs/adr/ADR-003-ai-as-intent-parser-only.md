# ADR-003: AI as Intent Parser Only

## Context

Forge's flagship feature lets a developer describe a contract in plain
English. A naive implementation would ask a language model to write
Aiken source directly — but eUTxO correctness bugs (e.g., double
satisfaction) are exactly the class of mistake a model can produce
confidently and wrongly, and Aiken has limited representation in most
models' training data.

## Decision

Restrict the language model (`ILanguageModelPort`) to exactly two
responsibilities: structured intent/parameter extraction, and narration of
already-computed deterministic facts. It never generates blockchain
logic. All Aiken source comes from a deterministic template-rendering
engine (`IContractTemplateEnginePort`) given an audited template plus
validated parameters.

## Alternatives Considered

- **Full open-ended LLM code generation with post-hoc review.** Maximizes
  flexibility, but makes correctness dependent on model output for every
  contract — untenable for financial logic and damaging to credibility
  with Cardano engineers.
- **LLM-assisted template authoring only, no runtime generation.** Safer,
  but removes the natural-language product experience entirely.
- **LLM output as an editable draft before compiling.** Still exposes
  unreviewed generated logic to the compile/deploy path — reintroduces
  the exact risk this ADR exists to avoid.

## Consequences

The "build a contract from a sentence" experience is real but currently
bounded by the template categories that exist (one, at present:
escrow-with-milestones). Genuinely novel contract logic still requires a
human to author a new template — a deliberate, stated scope limit (see
PRD "explicitly out of scope"), not a hidden one.
