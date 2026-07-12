import type { ForgePlugin, PluginContext } from "@forge/plugin-api";
import { describe, expect, it } from "vitest";
import {
  CyclicPluginDependencyError,
  MissingPluginDependencyError,
  topologicallySortPlugins,
} from "./topological-sort.js";

function fakePlugin(name: string, dependsOn?: readonly string[]): ForgePlugin {
  return {
    name,
    version: "0.0.0",
    dependsOn,
    register: (_context: PluginContext) => {},
  };
}

describe("topologicallySortPlugins", () => {
  it("returns plugins with no dependencies in their original order", () => {
    const a = fakePlugin("a");
    const b = fakePlugin("b");

    expect(topologicallySortPlugins([a, b])).toEqual([a, b]);
  });

  it("orders a plugin after the dependency it declares", () => {
    const base = fakePlugin("adapter-aiken");
    const dependent = fakePlugin("ai-testgen", ["adapter-aiken"]);

    const sorted = topologicallySortPlugins([dependent, base]);

    expect(sorted.map((plugin) => plugin.name)).toEqual(["adapter-aiken", "ai-testgen"]);
  });

  it("throws MissingPluginDependencyError when a dependency is not registered", () => {
    const dependent = fakePlugin("ai-testgen", ["adapter-aiken"]);

    expect(() => topologicallySortPlugins([dependent])).toThrow(MissingPluginDependencyError);
  });

  it("throws CyclicPluginDependencyError for a direct cycle", () => {
    const a = fakePlugin("a", ["b"]);
    const b = fakePlugin("b", ["a"]);

    expect(() => topologicallySortPlugins([a, b])).toThrow(CyclicPluginDependencyError);
  });

  it("throws CyclicPluginDependencyError for a longer cycle", () => {
    const a = fakePlugin("a", ["b"]);
    const b = fakePlugin("b", ["c"]);
    const c = fakePlugin("c", ["a"]);

    expect(() => topologicallySortPlugins([a, b, c])).toThrow(CyclicPluginDependencyError);
  });
});
