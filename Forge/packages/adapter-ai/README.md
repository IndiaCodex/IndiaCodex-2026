# @forge/adapter-ai

The real `ILanguageModelPort` implementation — local, deterministic, and
dependency-free. No hosted API, no network call, no API key.

## Why local instead of a hosted model

Per [ADR-003](../../docs/adr/ADR-003-ai-as-intent-parser-only.md), this
port's job is narrow: classify a description among a small set of known
templates, and pull a few parameters out of a sentence. A transparent
heuristic does that reliably; a network-dependent hosted model would
trade demo reliability for a task well-suited to a deterministic
approach. A hosted backend remains a drop-in future adapter behind the
same port if wanted later.

## What's here

- `classifyIntent` — keyword-coverage scoring against known template
  categories.
- `extractParameters` — finds digit or spelled-out numbers in free text;
  only ever sets a value when one was actually found, never guessed.
- `narrate` — turns recorded `Rationale` facts into readable, bulleted
  prose. Never originates a claim — every line traces back to a
  deterministic decision a use case already made.

`LocalLanguageModelAdapter` dispatches `extractStructured` calls to
either the intent classifier or the parameter extractor based on the
requested schema's shape (`category`+`confidence` → intent; anything else
→ parameters).
