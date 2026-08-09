import type { ForgePlugin } from "@forge/plugin-api";

export class CyclicPluginDependencyError extends Error {
  constructor(cycle: readonly string[]) {
    super(`Cyclic plugin dependency detected: ${cycle.join(" -> ")}`);
    this.name = "CyclicPluginDependencyError";
  }
}

export class MissingPluginDependencyError extends Error {
  constructor(pluginName: string, missingDependency: string) {
    super(`Plugin "${pluginName}" depends on "${missingDependency}", which is not registered`);
    this.name = "MissingPluginDependencyError";
  }
}

export function topologicallySortPlugins(plugins: readonly ForgePlugin[]): readonly ForgePlugin[] {
  const byName = new Map(plugins.map((plugin) => [plugin.name, plugin]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const sorted: ForgePlugin[] = [];

  function visit(plugin: ForgePlugin, path: readonly string[]): void {
    if (visited.has(plugin.name)) {
      return;
    }
    if (visiting.has(plugin.name)) {
      throw new CyclicPluginDependencyError([...path, plugin.name]);
    }

    visiting.add(plugin.name);
    for (const dependencyName of plugin.dependsOn ?? []) {
      const dependency = byName.get(dependencyName);
      if (!dependency) {
        throw new MissingPluginDependencyError(plugin.name, dependencyName);
      }
      visit(dependency, [...path, plugin.name]);
    }
    visiting.delete(plugin.name);
    visited.add(plugin.name);
    sorted.push(plugin);
  }

  for (const plugin of plugins) {
    visit(plugin, []);
  }

  return sorted;
}
