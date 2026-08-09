import type { Blueprint } from "@forge/domain";
import type { Logger } from "@forge/plugin-api";
import { describe, expect, it, vi } from "vitest";
import type { IAikenCompilerPort } from "../ports/aiken-compiler.port.js";
import { PlatformRegistry } from "../registry/platform-registry.js";
import { CompileUseCase } from "./compile.use-case.js";

function createSilentLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

const fakeBlueprint: Blueprint = {
  preamble: { title: "escrow", version: "1.0.0", plutusVersion: "v3" },
  validators: [
    {
      title: "escrow.spend",
      redeemer: { schema: { title: "Action" } },
      compiledCode: "590a",
      hash: "abc",
    },
  ],
  definitions: {},
};

describe("CompileUseCase", () => {
  it("fires beforeCompile then afterCompile with the resulting blueprint", async () => {
    const aikenCompiler: IAikenCompilerPort = {
      ensureProject: vi.fn().mockResolvedValue(undefined),
      build: vi.fn().mockResolvedValue(fakeBlueprint),
      test: vi.fn(),
    };
    const registry = new PlatformRegistry(createSilentLogger());
    const events: string[] = [];
    registry.onHook("beforeCompile", () => {
      events.push("beforeCompile");
    });
    registry.onHook("afterCompile", ({ blueprint }) => {
      events.push(`afterCompile:${blueprint.preamble.title}`);
    });

    const useCase = new CompileUseCase(aikenCompiler, registry);
    const project = { name: "escrow-demo", rootDir: "/tmp/escrow-demo" };
    const blueprint = await useCase.execute(project);

    expect(blueprint).toBe(fakeBlueprint);
    expect(aikenCompiler.ensureProject).toHaveBeenCalledWith("/tmp/escrow-demo", "escrow-demo");
    expect(aikenCompiler.build).toHaveBeenCalledWith("/tmp/escrow-demo");
    expect(events).toEqual(["beforeCompile", "afterCompile:escrow"]);
  });
});
