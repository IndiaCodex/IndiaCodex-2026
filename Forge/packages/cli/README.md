# @forge/cli

The `forge` command-line interface — the first real presentation layer
built on `@forge/sdk`. Contains no business logic of its own: only
argument parsing, plugin wiring, and progress narration via the
platform's existing hook system.

## Usage

```bash
forge build "Build an escrow smart contract with milestone-based payments"
```

Optional flags: `--name <project-name>` (default: derived from the
description), `--network <network>` (default: `preview`; one of
`emulator`, `preview`, `preprod`, `mainnet`), `--min-confidence <0-1>`
(default: `0.6` — the minimum template-match confidence required before
anything is generated; see
[ADR-006](../../docs/adr/ADR-006-confidence-gated-template-matching.md)).

## What one `forge build` call does

Wires every real adapter (filesystem, Aiken, templates, codegen, emulator,
providers, AI) into a `Forge` instance and calls `buildFromDescription`:
generate contract → scaffold → compile → generate SDK → test → review →
document → deploy. Contract generation runs _before_ scaffolding
specifically so a low-confidence template match is rejected before any
project directory is created. A small progress-narrator plugin prints
live status by listening to hooks the platform already fires — no new
hook types exist just for the CLI.

## Testing

`build.integration.test.ts` runs the real command end to end (real Aiken
compiler, real network) — run via `pnpm test:integration` from the repo
root.
