# @forge/adapter-filesystem

A real `IFileSystemPort` implementation backed by `node:fs/promises`.

## Why this package exists

`application`'s `ScaffoldProjectUseCase` depends on the abstract
`IFileSystemPort` so it can be unit-tested without touching real disk.
Something still has to provide the real implementation in production —
this two-file package is that binding. It was added during Phase 3 when
none of the originally-planned adapters turned out to own this generic a
concern.
