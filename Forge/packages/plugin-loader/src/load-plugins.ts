import type { ResolvedForgeConfig } from "@forge/domain";
import { PlatformRegistry } from "@forge/application";
import type { ForgePlugin, Logger, PortToken } from "@forge/plugin-api";
import { createPluginContext } from "./plugin-context-factory.js";
import { topologicallySortPlugins } from "./topological-sort.js";

export class MissingRequiredPortError extends Error {
  constructor(portDescription: string) {
    super(`Required port "${portDescription}" has no plugin bound to it.`);
    this.name = "MissingRequiredPortError";
  }
}

export interface LoadPluginsInput {
  readonly plugins: readonly ForgePlugin[];
  readonly config: ResolvedForgeConfig;
  readonly logger: Logger;
  readonly requiredPorts?: readonly PortToken<unknown>[];
}

/**
 * Boots the platform: orders plugins by declared dependency, gives each one
 * a PluginContext backed by the same PlatformRegistry, and fails fast if a
 * port the caller marked as required never got bound. Built-in adapters go
 * through this exact path — there is no separate, privileged loading
 * mechanism for them.
 */
export async function loadPlugins(input: LoadPluginsInput): Promise<PlatformRegistry> {
  const registry = new PlatformRegistry(input.logger);
  const ordered = topologicallySortPlugins(input.plugins);

  for (const plugin of ordered) {
    const context = createPluginContext(plugin, registry, input.logger, input.config);
    await plugin.register(context);
    input.logger.info(`Plugin loaded: ${plugin.name}@${plugin.version}`);
  }

  for (const port of input.requiredPorts ?? []) {
    if (!registry.hasPort(port)) {
      throw new MissingRequiredPortError(port.description);
    }
  }

  return registry;
}
