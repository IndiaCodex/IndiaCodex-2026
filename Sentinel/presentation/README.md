# Presentation

Ten source-of-truth slide files, one per topic, each with Title / Content /
Speaker Notes / Visual Suggestions — written to be read directly, edited in
any text editor, and kept in version control like the rest of this
repository.

| File                                                                     | Slide                                          |
| ------------------------------------------------------------------------ | ---------------------------------------------- |
| [`01-title.md`](01-title.md)                                             | Title                                          |
| [`02-problem.md`](02-problem.md)                                         | Problem                                        |
| [`03-why-existing-solutions-fail.md`](03-why-existing-solutions-fail.md) | Why Existing Solutions Fail                    |
| [`04-sentinel-architecture.md`](04-sentinel-architecture.md)             | Sentinel Architecture                          |
| [`05-demo.md`](05-demo.md)                                               | Live Demo (handoff to [`DEMO.md`](../DEMO.md)) |
| [`06-masumi-integration.md`](06-masumi-integration.md)                   | Masumi Integration                             |
| [`07-engineering-quality.md`](07-engineering-quality.md)                 | Engineering Quality                            |
| [`08-open-source-roadmap.md`](08-open-source-roadmap.md)                 | Open Source & Roadmap                          |
| [`09-commercial-potential.md`](09-commercial-potential.md)               | Commercial Potential                           |
| [`10-thank-you.md`](10-thank-you.md)                                     | Thank You                                      |

## The `.pptx`

A twelve-slide PowerPoint deck built from this content exists as a local,
generated file (`Sentinel-RC1-Presentation.pptx` in this directory) — dark
theme, real screenshots from `docs/screenshots/`, and the same Mermaid
diagrams from `docs/diagrams/` rendered to images and embedded directly.
It is **not** tracked in git, for the same reason `dist/` isn't: it's a
build artifact, not source. Regenerating it requires `python-pptx`,
`Pillow`, and `@mermaid-js/mermaid-cli` — none of which are workspace
dependencies, since nothing in Sentinel's own runtime needs them.

The deck's twelve slides don't map 1:1 to the ten files above — it opens
with a dedicated architecture slide and an end-to-end flow slide built
from `docs/diagrams/` that the ten source files reference but don't
duplicate.
