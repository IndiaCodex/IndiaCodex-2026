import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { escrowBlueprintFixture } from "./fixtures.js";
import { SdkGeneratorAdapter } from "./sdk-generator-adapter.js";

describe("SdkGeneratorAdapter", () => {
  let outDir: string;

  beforeEach(async () => {
    outDir = await mkdtemp(join(tmpdir(), "forge-codegen-test-"));
  });

  afterEach(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it("writes a generated index.ts file into the given output directory", async () => {
    const adapter = new SdkGeneratorAdapter();

    const files = await adapter.generate(escrowBlueprintFixture, outDir);

    expect(files).toEqual([join(outDir, "index.ts")]);
    const content = await readFile(files[0]!, "utf8");
    expect(content).toContain("export interface EscrowDatum {");
  });
});
