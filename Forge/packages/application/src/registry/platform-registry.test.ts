import { createPortToken } from "@forge/plugin-api";
import type { Logger } from "@forge/plugin-api";
import { describe, expect, it, vi } from "vitest";
import { MissingPortBindingError } from "./missing-port-binding-error.js";
import { PlatformRegistry } from "./platform-registry.js";

function createSilentLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe("PlatformRegistry", () => {
  it("returns a bound port implementation", () => {
    const registry = new PlatformRegistry(createSilentLogger());
    const token = createPortToken<{ ping(): string }>("IPingPort");
    const implementation = { ping: () => "pong" };

    registry.bindPort(token, implementation);

    expect(registry.hasPort(token)).toBe(true);
    expect(registry.getPort(token).ping()).toBe("pong");
  });

  it("throws MissingPortBindingError when a port was never bound", () => {
    const registry = new PlatformRegistry(createSilentLogger());
    const token = createPortToken<{ ping(): string }>("IUnboundPort");

    expect(registry.hasPort(token)).toBe(false);
    expect(() => registry.getPort(token)).toThrow(MissingPortBindingError);
    expect(() => registry.getPort(token)).toThrow(/IUnboundPort/);
  });

  it("fires hook handlers in registration order with the correct payload", async () => {
    const registry = new PlatformRegistry(createSilentLogger());
    const calls: string[] = [];

    registry.onHook("beforeCompile", ({ project }) => {
      calls.push(`first:${project.name}`);
    });
    registry.onHook("beforeCompile", ({ project }) => {
      calls.push(`second:${project.name}`);
    });

    await registry.fireHook("beforeCompile", {
      project: { name: "escrow-demo", rootDir: "/tmp/escrow-demo" },
    });

    expect(calls).toEqual(["first:escrow-demo", "second:escrow-demo"]);
  });

  it("does nothing when firing a hook with no registered handlers", async () => {
    const registry = new PlatformRegistry(createSilentLogger());

    await expect(
      registry.fireHook("onSdkGenerated", {
        project: { name: "escrow-demo", rootDir: "/tmp/escrow-demo" },
      }),
    ).resolves.toBeUndefined();
  });

  it("registers and lists commands and generators", () => {
    const registry = new PlatformRegistry(createSilentLogger());

    registry.registerCommand({
      name: "create",
      description: "Generate a project from a description",
      execute: () => Promise.resolve(),
    });
    registry.registerGenerator({
      name: "security-tests",
      description: "Generate eUTxO security tests",
      generate: () => Promise.resolve([]),
    });

    expect(registry.getCommands().map((command) => command.name)).toEqual(["create"]);
    expect(registry.getGenerators().map((generator) => generator.name)).toEqual(["security-tests"]);
  });
});
