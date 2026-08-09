import type { Blueprint } from "@forge/domain";
import type { Logger } from "@forge/plugin-api";
import { describe, expect, it, vi } from "vitest";
import type { ISdkGeneratorPort } from "../ports/sdk-generator.port.js";
import { PlatformRegistry } from "../registry/platform-registry.js";
import { GenerateSdkUseCase } from "./generate-sdk.use-case.js";

function createSilentLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

const fakeBlueprint: Blueprint = {
  preamble: { title: "escrow", version: "1.0.0", plutusVersion: "v3" },
  validators: [],
  definitions: {},
};

describe("GenerateSdkUseCase", () => {
  it("generates into sdk/generated under the project root and fires onSdkGenerated", async () => {
    const sdkGenerator: ISdkGeneratorPort = {
      generate: vi.fn().mockResolvedValue(["Datum.ts", "Redeemer.ts"]),
    };
    const registry = new PlatformRegistry(createSilentLogger());
    let fired = false;
    registry.onHook("onSdkGenerated", () => {
      fired = true;
    });

    const useCase = new GenerateSdkUseCase(sdkGenerator, registry);
    const project = { name: "escrow-demo", rootDir: "/tmp/escrow-demo" };
    const files = await useCase.execute(project, fakeBlueprint);

    expect(sdkGenerator.generate).toHaveBeenCalledWith(
      fakeBlueprint,
      "/tmp/escrow-demo/sdk/generated",
    );
    expect(files).toEqual(["Datum.ts", "Redeemer.ts"]);
    expect(fired).toBe(true);
  });
});
