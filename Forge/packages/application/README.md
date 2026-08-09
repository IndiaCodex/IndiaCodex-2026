# @forge/application

The platform's use cases, port interfaces, and the plugin/hook registry —
Clean Architecture's "application" layer. Nothing here imports a concrete
adapter; everything depends only on interfaces.

## Ports

`IAikenCompilerPort`, `ISdkGeneratorPort`, `IEmulatorPort`,
`IChainProviderPort`, `ITxBuilderPort`, `IDeploymentStorePort`,
`IDevnetPort`, `IFileSystemPort`, `ILanguageModelPort`,
`IContractTemplateEnginePort` — each with a matching `PortToken` constant
for binding.

## Registry

`PlatformRegistry` holds port bindings, the hook bus, and registered
commands/generators. Plugins populate it via `plugin-loader`; use cases
read from it.

## Use cases

`ScaffoldProject`, `Compile`, `GenerateSdk`, `RunTests`, `Deploy`,
`SelectTemplate`, `GenerateContract`, `ReviewContract`, `Explain`,
`GenerateDocs`, `GenerateSecurityTests`, and the `BuildFromDescription`
orchestrator that composes all of them into the `forge build` pipeline.

Every use case takes its dependencies through its constructor — no
globals, no service locator. See
[docs/Architecture.md](../../docs/Architecture.md) for the full port list,
the build-flow diagram, and the dependency-injection pattern used
throughout.
