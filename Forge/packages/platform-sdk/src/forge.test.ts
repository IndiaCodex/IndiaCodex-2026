import type {
  Blueprint,
  ContractTemplate,
  DeploymentManifest,
  GeneratedContract,
  ResolvedForgeConfig,
  ValidatorBlueprint,
} from "@forge/domain";
import {
  IAikenCompilerPortToken,
  IChainProviderPortToken,
  IContractTemplateEnginePortToken,
  IDeploymentStorePortToken,
  IEmulatorPortToken,
  IFileSystemPortToken,
  ILanguageModelPortToken,
  ISdkGeneratorPortToken,
  ITxBuilderPortToken,
} from "@forge/application";
import type { ForgePlugin, Logger, PluginContext } from "@forge/plugin-api";
import { describe, expect, it, vi } from "vitest";
import { Forge } from "./forge.js";

function createSilentLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

const config: ResolvedForgeConfig = {
  projectRoot: "/tmp/escrow-demo",
  network: "emulator",
  plugins: [],
};

const validator: ValidatorBlueprint = {
  title: "escrow_milestone.spend",
  redeemer: { schema: { title: "Action" } },
  compiledCode: "590a",
  hash: "hash-1",
};

const blueprint: Blueprint = {
  preamble: { title: "escrow-demo", version: "1.0.0", plutusVersion: "v3" },
  validators: [validator],
  definitions: {},
};

const escrowTemplate: ContractTemplate = {
  id: "escrow-milestone",
  name: "Escrow with milestone payments",
  description: "Releases funds as milestones are met",
  category: "escrow-milestone",
  parameters: [],
  sourceTemplate: "validator escrow_milestone { }",
};

const generatedContract: GeneratedContract = {
  templateId: "escrow-milestone",
  parameters: {},
  source: "validator escrow_milestone { }",
  fileName: "escrow_milestone.ak",
};

function createFakePlatformPlugin(): ForgePlugin {
  return {
    name: "fake-platform",
    version: "0.0.0",
    register: (context: PluginContext) => {
      context.bindPort(IFileSystemPortToken, {
        mkdir: () => Promise.resolve(),
        writeFile: () => Promise.resolve(),
        readFile: () => Promise.resolve(""),
        exists: () => Promise.resolve(false),
      });
      context.bindPort(IAikenCompilerPortToken, {
        ensureProject: () => Promise.resolve(),
        build: () => Promise.resolve(blueprint),
        test: () => Promise.resolve([]),
      });
      context.bindPort(ISdkGeneratorPortToken, {
        generate: () => Promise.resolve(["Datum.ts"]),
      });
      context.bindPort(IEmulatorPortToken, {
        seed: () => Promise.resolve(),
        run: () =>
          Promise.resolve({
            name: "happy path",
            kind: "functional" as const,
            passed: true,
            durationMs: 5,
          }),
      });
      context.bindPort(IChainProviderPortToken, {
        computeScriptAddress: () => Promise.resolve("addr_test1..."),
      });
      context.bindPort(ITxBuilderPortToken, { buildAndSubmit: () => Promise.resolve("txhash1") });
      const manifests = new Map<string, DeploymentManifest>();
      context.bindPort(IDeploymentStorePortToken, {
        write: (manifest: DeploymentManifest) => {
          manifests.set(manifest.validatorTitle, manifest);
          return Promise.resolve();
        },
        read: (_network, validatorTitle: string) => Promise.resolve(manifests.get(validatorTitle)),
      });
      context.bindPort(IContractTemplateEnginePortToken, {
        listTemplates: () => Promise.resolve([escrowTemplate]),
        render: () => Promise.resolve(generatedContract),
      });
      context.bindPort(ILanguageModelPortToken, {
        extractStructured: () => Promise.resolve({ category: "escrow-milestone", confidence: 0.9 }),
        narrate: () => Promise.resolve("Narrated explanation."),
      });
    },
  };
}

describe("Forge", () => {
  it("boots from a plugin list and exposes registered commands", async () => {
    const forge = await Forge.create({
      plugins: [
        {
          name: "command-plugin",
          version: "0.0.0",
          register: (context: PluginContext) => {
            context.registerCommand({
              name: "create",
              description: "Generate a project from a description",
              execute: () => Promise.resolve(),
            });
          },
        },
      ],
      config,
      logger: createSilentLogger(),
    });

    expect(forge.commands.map((command) => command.name)).toEqual(["create"]);
  });

  it("delegates scaffoldProject, compile, and generateSdk to the bound ports", async () => {
    const forge = await Forge.create({
      plugins: [createFakePlatformPlugin()],
      config,
      logger: createSilentLogger(),
    });

    const project = await forge.scaffoldProject({
      name: "escrow-demo",
      rootDir: "/tmp/escrow-demo",
    });
    expect(project.name).toBe("escrow-demo");

    const compiledBlueprint = await forge.compile(project);
    expect(compiledBlueprint).toBe(blueprint);

    const sdkFiles = await forge.generateSdk(project, compiledBlueprint);
    expect(sdkFiles).toEqual(["Datum.ts"]);
  });

  it("runs the full buildFromDescription pipeline through the facade", async () => {
    const forge = await Forge.create({
      plugins: [createFakePlatformPlugin()],
      config,
      logger: createSilentLogger(),
    });

    const result = await forge.buildFromDescription({
      description: "Build an escrow smart contract with milestone-based payments",
      projectName: "escrow-demo",
      rootDir: "/tmp/escrow-demo",
      network: "emulator",
      wallets: [],
      testScenarios: [
        { name: "happy path", kind: "functional", description: "beneficiary claims a milestone" },
      ],
    });

    expect(result.contract).toBe(generatedContract);
    expect(result.deployment.address).toBe("addr_test1...");
    expect(result.testReport.passedCount).toBeGreaterThan(0);
    expect(result.testReport.failedCount).toBe(0);
  });

  it("falls back to templated explanations when no language model plugin is bound", async () => {
    const forge = await Forge.create({
      plugins: [
        {
          name: "no-ai-plugin",
          version: "0.0.0",
          register: () => {},
        },
      ],
      config,
      logger: createSilentLogger(),
    });

    const explanation = await forge.explain("milestoneCount", [
      {
        subject: "milestoneCount",
        category: "parameter",
        decision: '"milestoneCount" = 3',
        factors: ["template default"],
      },
    ]);

    expect(explanation.narrative).toContain('"milestoneCount" = 3');
  });
});
