import type { ResolvedForgeConfig } from "@forge/domain";
import type { CommandDefinition, GeneratorDefinition } from "./command.js";
import type { HookEvent, HookHandler } from "./hooks.js";
import type { Logger } from "./logger.js";
import type { PortToken } from "./port-token.js";

export interface PluginContext {
  bindPort<T>(port: PortToken<T>, implementation: T): void;
  onHook<E extends HookEvent>(event: E, handler: HookHandler<E>): void;
  registerCommand(command: CommandDefinition): void;
  registerGenerator(generator: GeneratorDefinition): void;
  readonly logger: Logger;
  readonly config: ResolvedForgeConfig;
}
