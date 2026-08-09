import type { ResolvedForgeConfig } from "@forge/domain";
import { createPortToken } from "@forge/plugin-api";
import type { ForgePlugin, Logger, PluginContext } from "@forge/plugin-api";
import { describe, expect, it, vi } from "vitest";
import { loadPlugins, MissingRequiredPortError } from "./load-plugins.js";

function createSilentLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

const config: ResolvedForgeConfig = {
  projectRoot: "/tmp/escrow-demo",
  network: "emulator",
  plugins: [],
};

const pingPort = createPortToken<{ ping(): string }>("IPingPort");

describe("loadPlugins", () => {
  it("registers plugins in dependency order and binds their ports", async () => {
    const order: string[] = [];
    const base: ForgePlugin = {
      name: "adapter-ping",
      version: "1.0.0",
      register: (context: PluginContext) => {
        order.push("adapter-ping");
        context.bindPort(pingPort, { ping: () => "pong" });
      },
    };
    const dependent: ForgePlugin = {
      name: "ping-consumer",
      version: "1.0.0",
      dependsOn: ["adapter-ping"],
      register: () => {
        order.push("ping-consumer");
      },
    };

    const registry = await loadPlugins({
      plugins: [dependent, base],
      config,
      logger: createSilentLogger(),
      requiredPorts: [pingPort],
    });

    expect(order).toEqual(["adapter-ping", "ping-consumer"]);
    expect(registry.getPort(pingPort).ping()).toBe("pong");
  });

  it("throws MissingRequiredPortError when a required port is never bound", async () => {
    const plugin: ForgePlugin = {
      name: "no-op-plugin",
      version: "1.0.0",
      register: () => {},
    };

    await expect(
      loadPlugins({
        plugins: [plugin],
        config,
        logger: createSilentLogger(),
        requiredPorts: [pingPort],
      }),
    ).rejects.toThrow(MissingRequiredPortError);
  });

  it("gives each plugin a logger scoped with its own name", async () => {
    const logger = createSilentLogger();
    let capturedContext: PluginContext | undefined;
    const plugin: ForgePlugin = {
      name: "adapter-ping",
      version: "1.0.0",
      register: (context: PluginContext) => {
        capturedContext = context;
      },
    };

    await loadPlugins({ plugins: [plugin], config, logger });

    capturedContext?.logger.info("hello");
    expect(logger.info).toHaveBeenCalledWith("[adapter-ping] hello", undefined);
  });
});
