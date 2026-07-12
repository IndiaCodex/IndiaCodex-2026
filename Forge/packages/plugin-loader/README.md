# @forge/plugin-loader

Boots the platform: orders plugins by declared dependency, gives each one
a `PluginContext`, and fails fast if a required port was never bound.

## What's here

- `topologicallySortPlugins` — orders plugins by `dependsOn`, with
  `CyclicPluginDependencyError` and `MissingPluginDependencyError` for the
  two ways that can go wrong.
- `createPluginContext` — builds the `PluginContext` a plugin's
  `register()` receives, with its logger prefixed by the plugin's name.
- `loadPlugins` — runs the whole sequence and throws
  `MissingRequiredPortError` if a caller-specified required port was never
  bound by any plugin.

Built-in adapters and third-party plugins go through this exact same
path — see
[docs/adr/ADR-002-plugin-architecture.md](../../docs/adr/ADR-002-plugin-architecture.md).
