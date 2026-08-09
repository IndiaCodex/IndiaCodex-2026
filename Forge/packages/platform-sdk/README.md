# @forge/sdk

The public facade every presentation layer depends on — the `forge` CLI
today, potentially a future IDE extension or web playground. It contains
no business logic of its own; every method resolves the ports it needs
from the plugin registry and delegates to an `application` use case.

## Usage

```ts
import { Forge } from "@forge/sdk";
import { createAiPlugin } from "@forge/adapter-ai";
import { createAikenPlugin } from "@forge/adapter-aiken";
// ...and the rest of the adapters you want bound.

const forge = await Forge.create({
  plugins: [createAikenPlugin(), createAiPlugin() /* ... */],
  config: { projectRoot: "/path/to/project", network: "preview", plugins: [] },
  logger: myLogger,
});

const result = await forge.buildFromDescription({
  description: "Build an escrow smart contract with milestone-based payments",
  projectName: "escrow-demo",
  rootDir: "/path/to/project",
  network: "preview",
  wallets: [],
  testScenarios: [],
});
```

`@forge/sdk` re-exports `domain`, `plugin-api`, and `application`, so a
plugin author only ever needs this one dependency.

See [docs/Architecture.md](../../docs/Architecture.md) for the full method
list and how `Forge` composes use cases with concrete port bindings.
