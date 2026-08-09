import { readFile, rm, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAikenPlugin } from "@forge/adapter-aiken";
import { createCodegenTsPlugin } from "@forge/adapter-codegen-ts";
import { createEmulatorPlugin } from "@forge/adapter-emulator";
import { createFileSystemPlugin } from "@forge/adapter-filesystem";
import { ILanguageModelPortToken } from "@forge/application";
import { createContractTemplatesPlugin } from "@forge/contract-templates";
import type { ForgePlugin, PluginContext } from "@forge/plugin-api";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Forge } from "./forge.js";

/**
 * Stands in for the not-yet-built adapter-ai: a minimal, deterministic
 * "language model" used only to prove the pipeline's wiring end to end.
 * It is not shipped as a real adapter and makes no claim to understand
 * arbitrary descriptions — real intent parsing is adapter-ai's job in a
 * later phase.
 */
function createFakeLanguageModelPlugin(): ForgePlugin {
  return {
    name: "fake-language-model",
    version: "0.0.0",
    register: (context: PluginContext) => {
      context.bindPort(ILanguageModelPortToken, {
        extractStructured: (request) => {
          if ("category" in request.schema.properties) {
            return Promise.resolve({ category: "escrow-milestone", confidence: 0.95 });
          }
          return Promise.resolve({ milestoneCount: 4 });
        },
        narrate: (request) =>
          Promise.resolve(request.facts.map((fact) => fact.decision).join("; ")),
      });
    },
  };
}

describe("Forge end-to-end: real Aiken compiler, real templates, real codegen, real emulator", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "forge-e2e-"));
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it("produces a real, compiled, typed, tested escrow project from a natural-language description", async () => {
    const forge = await Forge.create({
      plugins: [
        createFileSystemPlugin(),
        createAikenPlugin(),
        createContractTemplatesPlugin(),
        createCodegenTsPlugin(),
        createEmulatorPlugin(),
        createFakeLanguageModelPlugin(),
      ],
      config: { projectRoot: rootDir, network: "emulator", plugins: [] },
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
    });

    const project = await forge.scaffoldProject({ name: "escrow-demo", rootDir });

    const { contract, templateRationale, parameterRationales } = await forge.generateContract(
      "Build an escrow smart contract with milestone-based payments",
    );
    expect(contract.source).toContain("validator escrow_milestone");
    expect(contract.source).toContain("const milestone_count: Int = 4");
    expect(templateRationale.subject).toBe("escrow-milestone");
    expect(parameterRationales.length).toBeGreaterThan(0);

    await writeFile(join(rootDir, "validators", contract.fileName), contract.source);

    const blueprint = await forge.compile(project);
    expect(blueprint.preamble.plutusVersion).toBe("v3");
    expect(blueprint.validators).toHaveLength(1);
    expect(blueprint.validators[0]?.title).toBe("escrow_milestone.escrow_milestone.spend");

    const sdkFiles = await forge.generateSdk(project, blueprint);
    expect(sdkFiles).toHaveLength(1);
    const sdkContent = await readFile(sdkFiles[0]!, "utf8");
    expect(sdkContent).toContain("export interface EscrowDatum {");
    expect(sdkContent).toContain("export type EscrowRedeemer =");

    const testReport = await forge.runTests({
      project,
      wallets: [
        {
          address: "addr_test1beneficiary",
          utxos: [
            {
              txHash: "seed",
              outputIndex: 0,
              address: "addr_test1beneficiary",
              assets: { lovelace: 5_000_000n },
            },
          ],
        },
      ],
      scenarios: [
        { name: "happy path", kind: "functional", description: "beneficiary claims a milestone" },
      ],
    });
    expect(testReport.failedCount).toBe(0);
    expect(testReport.passedCount).toBeGreaterThan(0);
  }, 60_000);
});
