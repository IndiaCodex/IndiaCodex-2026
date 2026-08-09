# Architecture diagrams

Rendered PNG images of Forge's architecture, generated directly from the
same Mermaid source used in `docs/Architecture.md` and the root
`README.md` — these are presentation-friendly exports of diagrams that
already render natively on GitHub, not a separate or diverging set of
claims.

| File                                                                   | Shows                                                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`01-overall-architecture.png`](01-overall-architecture.png)           | Developer → CLI → Application → Plugin System → Adapters → Aiken/SDK/Emulator                             |
| [`02-clean-architecture-layers.png`](02-clean-architecture-layers.png) | Domain → Application → Plugin API → Adapters → External Tools                                             |
| [`03-end-to-end-pipeline.png`](03-end-to-end-pipeline.png)             | Natural language → intent → confidence gate → compile → blueprint → SDK → tests → deployment              |
| [`04-plugin-architecture.png`](04-plugin-architecture.png)             | How `plugin-loader` orders, registers, and verifies every plugin (built-in or third-party)                |
| [`05-request-lifecycle.png`](05-request-lifecycle.png)                 | The conceptual lifecycle of one `forge build` call, generate through deploy                               |
| [`06-template-selection-flow.png`](06-template-selection-flow.png)     | How `classifyIntent` and `SelectTemplateUseCase` turn a description into a template choice or a rejection |
| [`07-build-pipeline-detail.png`](07-build-pipeline-detail.png)         | The same lifecycle at the concrete use-case level (`GenerateContractUseCase` → ... → `DeployUseCase`)     |

Diagrams 1–3 mirror the three diagrams already embedded in
`docs/Architecture.md` and the root `README.md` (kept deliberately to
three in the docs themselves — see that file's opening note). Diagrams
4–7 are additional detail views for presentations, generated from the
same real port/use-case names as the source code — see
[`docs/Architecture.md`](../../docs/Architecture.md) for the prose
explanation behind each.
