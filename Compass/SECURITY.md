# Security Policy

## Reporting a Vulnerability

Please do not open a public GitHub issue for a suspected security vulnerability. Instead, use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) on this repository's Security tab, which opens a private advisory visible only to maintainers until a fix is ready.

Include, where possible:

- The affected package (`core/domain`, `core/application`, `plugins/midnight`, a specific `interfaces/*` package, etc.)
- Steps to reproduce, or a minimal example
- The potential impact as you understand it

## Scope

Compass is a compatibility-analysis tool that reads public release and dependency metadata (via the GitHub REST API) and writes its own output (Markdown/HTML reports, a local SQLite file). Areas most worth independent scrutiny:

- **Credential handling** — a GitHub token is passed as a CLI flag or Action input and used only to construct request headers; it is never logged or written to any generated report. If you find a path where a token could be logged, persisted, or echoed into output, that's a real finding.
- **Generated HTML output** (`interfaces/reporting`'s dashboard and PR comment rendering) — all dynamic values are passed through `escapeHtml` before interpolation into HTML. A missed escape path that lets ecosystem-sourced data (a component name, a version string) inject markup is a real finding.
- **The GitHub Action's PR comment posting** — it only ever posts to the pull request the triggering event identifies, using the token the workflow explicitly grants it.

## Supported Versions

This project has not yet made a first tagged release; all reports are evaluated against the `main` branch.

## Response

There is no formal SLA at this stage of the project. Reports will be acknowledged and triaged as promptly as possible given the project's current (hackathon-stage) staffing.
