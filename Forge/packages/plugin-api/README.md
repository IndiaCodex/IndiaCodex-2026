# @forge/plugin-api

The extensibility contract every Forge plugin — built-in or third-party —
implements against.

## What's here

- `ForgePlugin` — the shape of a plugin (`name`, `version`, optional
  `dependsOn`, and `register(context)`).
- `PluginContext` — what a plugin's `register` function receives:
  `bindPort`, `onHook`, `registerCommand`, `registerGenerator`, a scoped
  `logger`, and the resolved `config`.
- `PortToken` / `createPortToken` — a typed dependency-injection token
  pattern used to bind and resolve port implementations without any
  reflection or magic strings.
- `HookEvent` / `HookPayloadMap` / `HookHandler` — the platform's typed
  lifecycle events (`onProjectInit`, `beforeCompile`/`afterCompile`,
  `beforeTest`/`afterTest`, `beforeDeploy`/`afterDeploy`, `onSdkGenerated`).
- `CommandDefinition` / `GeneratorDefinition` — how a plugin contributes a
  CLI command or a test/artifact generator.

## Design note

Built-in adapters (`adapter-aiken`, `adapter-emulator`, etc.) register
through this exact same API — there is no privileged, core-only path. See
[docs/adr/ADR-002-plugin-architecture.md](../../docs/adr/ADR-002-plugin-architecture.md).
