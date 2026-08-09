import type { PluginContext } from "./plugin-context.js";

export interface ForgePlugin {
  readonly name: string;
  readonly version: string;
  readonly dependsOn?: readonly string[];
  register(context: PluginContext): void | Promise<void>;
}
