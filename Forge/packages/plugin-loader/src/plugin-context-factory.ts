import type { ResolvedForgeConfig } from "@forge/domain";
import type { PlatformRegistry } from "@forge/application";
import type { ForgePlugin, Logger, PluginContext } from "@forge/plugin-api";

function scopeLoggerToPlugin(logger: Logger, plugin: ForgePlugin): Logger {
  const prefix = `[${plugin.name}]`;
  return {
    debug: (message, meta) => {
      logger.debug(`${prefix} ${message}`, meta);
    },
    info: (message, meta) => {
      logger.info(`${prefix} ${message}`, meta);
    },
    warn: (message, meta) => {
      logger.warn(`${prefix} ${message}`, meta);
    },
    error: (message, meta) => {
      logger.error(`${prefix} ${message}`, meta);
    },
  };
}

export function createPluginContext(
  plugin: ForgePlugin,
  registry: PlatformRegistry,
  logger: Logger,
  config: ResolvedForgeConfig,
): PluginContext {
  return {
    bindPort: (port, implementation) => {
      registry.bindPort(port, implementation);
    },
    onHook: (event, handler) => {
      registry.onHook(event, handler);
    },
    registerCommand: (command) => {
      registry.registerCommand(command);
    },
    registerGenerator: (generator) => {
      registry.registerGenerator(generator);
    },
    logger: scopeLoggerToPlugin(logger, plugin),
    config,
  };
}
