import type { Logger } from "@forge/plugin-api";
import { describe, expect, it, vi } from "vitest";
import type { IFileSystemPort } from "../ports/file-system.port.js";
import { PlatformRegistry } from "../registry/platform-registry.js";
import { ScaffoldProjectUseCase } from "./scaffold-project.use-case.js";

function createSilentLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createFakeFileSystem(): IFileSystemPort {
  const files = new Map<string, string>();
  return {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn((path: string, contents: string) => {
      files.set(path, contents);
      return Promise.resolve();
    }),
    readFile: vi.fn((path: string) => {
      const contents = files.get(path);
      if (contents === undefined) throw new Error(`no such file: ${path}`);
      return Promise.resolve(contents);
    }),
    exists: vi.fn((path: string) => Promise.resolve(files.has(path))),
  };
}

describe("ScaffoldProjectUseCase", () => {
  it("creates the project skeleton and fires onProjectInit", async () => {
    const fileSystem = createFakeFileSystem();
    const registry = new PlatformRegistry(createSilentLogger());
    const received: string[] = [];
    registry.onHook("onProjectInit", ({ project }) => {
      received.push(project.name);
    });

    const useCase = new ScaffoldProjectUseCase(fileSystem, registry);
    const project = await useCase.execute({ name: "escrow-demo", rootDir: "/tmp/escrow-demo" });

    expect(project).toEqual({ name: "escrow-demo", rootDir: "/tmp/escrow-demo" });
    expect(fileSystem.mkdir).toHaveBeenCalledWith("/tmp/escrow-demo/validators");
    expect(fileSystem.mkdir).toHaveBeenCalledWith("/tmp/escrow-demo/tests");
    expect(fileSystem.writeFile).toHaveBeenCalledWith(
      "/tmp/escrow-demo/README.md",
      expect.stringContaining("escrow-demo"),
    );
    expect(received).toEqual(["escrow-demo"]);
  });
});
