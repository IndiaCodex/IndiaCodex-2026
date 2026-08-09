import type {
  Blueprint,
  ContractTemplate,
  DeploymentManifest,
  GeneratedContract,
  TestResult,
  ValidatorBlueprint,
} from "@forge/domain";
import type { Logger } from "@forge/plugin-api";
import { describe, expect, it, vi } from "vitest";
import type { IAikenCompilerPort } from "../ports/aiken-compiler.port.js";
import type { IChainProviderPort } from "../ports/chain-provider.port.js";
import type { IContractTemplateEnginePort } from "../ports/contract-template-engine.port.js";
import type { IDeploymentStorePort } from "../ports/deployment-store.port.js";
import type { IEmulatorPort } from "../ports/emulator.port.js";
import type { IFileSystemPort } from "../ports/file-system.port.js";
import type { ILanguageModelPort } from "../ports/language-model.port.js";
import type { ITxBuilderPort } from "../ports/tx-builder.port.js";
import { PlatformRegistry } from "../registry/platform-registry.js";
import { BuildFromDescriptionUseCase } from "./build-from-description.use-case.js";
import { CompileUseCase } from "./compile.use-case.js";
import { DeployUseCase } from "./deploy.use-case.js";
import { GenerateContractUseCase } from "./generate-contract.use-case.js";
import { GenerateDocsUseCase } from "./generate-docs.use-case.js";
import { GenerateSdkUseCase } from "./generate-sdk.use-case.js";
import { GenerateSecurityTestsUseCase } from "./generate-security-tests.use-case.js";
import { ReviewContractUseCase } from "./review-contract.use-case.js";
import { RunTestsUseCase } from "./run-tests.use-case.js";
import { ScaffoldProjectUseCase } from "./scaffold-project.use-case.js";
import {
  LowConfidenceTemplateMatchError,
  SelectTemplateUseCase,
} from "./select-template.use-case.js";

function createSilentLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

const escrowTemplate: ContractTemplate = {
  id: "escrow-milestone",
  name: "Escrow with milestone payments",
  description: "Releases funds to a beneficiary as milestones are met",
  category: "escrow-milestone",
  parameters: [
    {
      name: "milestoneCount",
      type: "number",
      description: "How many milestones",
      required: true,
      defaultValue: 3,
    },
  ],
  sourceTemplate: "validator escrow_milestone(milestone_count: Int) { }",
};

const generatedContract: GeneratedContract = {
  templateId: "escrow-milestone",
  parameters: { milestoneCount: 3 },
  source: "validator escrow_milestone(milestone_count: Int) { }",
  fileName: "escrow_milestone.ak",
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

describe("BuildFromDescriptionUseCase", () => {
  it("runs the full forge create pipeline end to end from a description", async () => {
    const registry = new PlatformRegistry(createSilentLogger());
    const securityResult: TestResult = {
      name: "no double satisfaction",
      kind: "security",
      passed: true,
      durationMs: 2,
    };
    registry.registerGenerator({
      name: "double-satisfaction-rule",
      description: "checks for shared validator addresses",
      generate: vi.fn().mockResolvedValue([securityResult]),
    });

    const fileSystem: IFileSystemPort = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn(),
      exists: vi.fn().mockResolvedValue(false),
    };

    const languageModel: ILanguageModelPort = {
      extractStructured: vi
        .fn()
        .mockResolvedValueOnce({ category: "escrow-milestone", confidence: 0.9 })
        .mockResolvedValueOnce({ milestoneCount: 3 }),
      narrate: vi.fn().mockResolvedValue("This is a standard milestone escrow."),
    };
    const templateEngine: IContractTemplateEnginePort = {
      listTemplates: vi.fn().mockResolvedValue([escrowTemplate]),
      render: vi.fn().mockResolvedValue(generatedContract),
    };
    const aikenCompiler: IAikenCompilerPort = {
      ensureProject: vi.fn().mockResolvedValue(undefined),
      build: vi.fn().mockResolvedValue(blueprint),
      test: vi.fn().mockResolvedValue([]),
    };
    const emulator: IEmulatorPort = {
      seed: vi.fn().mockResolvedValue(undefined),
      run: vi.fn(),
    };
    const chainProvider: IChainProviderPort = {
      computeScriptAddress: vi.fn().mockResolvedValue("addr_test1..."),
    };
    const txBuilder: ITxBuilderPort = { buildAndSubmit: vi.fn() };
    let savedManifest: DeploymentManifest | undefined;
    const deploymentStore: IDeploymentStorePort = {
      write: vi.fn((manifest: DeploymentManifest) => {
        savedManifest = manifest;
        return Promise.resolve();
      }),
      read: vi.fn(),
    };

    const orchestrator = new BuildFromDescriptionUseCase(
      new ScaffoldProjectUseCase(fileSystem, registry),
      new GenerateContractUseCase(languageModel, templateEngine, new SelectTemplateUseCase()),
      new CompileUseCase(aikenCompiler, registry),
      new GenerateSdkUseCase({ generate: vi.fn().mockResolvedValue(["Datum.ts"]) }, registry),
      new RunTestsUseCase(aikenCompiler, emulator, registry),
      new GenerateSecurityTestsUseCase(registry),
      new ReviewContractUseCase(languageModel),
      new GenerateDocsUseCase(languageModel),
      new DeployUseCase(chainProvider, txBuilder, deploymentStore, registry),
      fileSystem,
    );

    const result = await orchestrator.execute({
      description: "Build an escrow smart contract with milestone-based payments",
      projectName: "escrow-demo",
      rootDir: "/tmp/escrow-demo",
      network: "preview",
      wallets: [],
      testScenarios: [],
    });

    expect(result.project.name).toBe("escrow-demo");
    expect(result.contract).toBe(generatedContract);
    expect(result.blueprint).toBe(blueprint);
    expect(result.sdkFiles).toEqual(["Datum.ts"]);
    expect(result.testReport.passedCount).toBe(1);
    expect(result.testReport.failedCount).toBe(0);
    expect(result.review.observations[0]?.summary).toBe("This is a standard milestone escrow.");
    expect(result.documentation.content).toContain("escrow_milestone.spend");
    expect(result.deployment.address).toBe("addr_test1...");
    expect(result.rationales.length).toBeGreaterThan(0);
    expect(savedManifest).toEqual(result.deployment);
    expect(fileSystem.writeFile).toHaveBeenCalledWith(
      "/tmp/escrow-demo/validators/escrow_milestone.ak",
      generatedContract.source,
    );
  });

  it("never scaffolds or writes anything when the description matches with low confidence", async () => {
    const registry = new PlatformRegistry(createSilentLogger());

    const fileSystem: IFileSystemPort = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn(),
      exists: vi.fn().mockResolvedValue(false),
    };

    const languageModel: ILanguageModelPort = {
      extractStructured: vi
        .fn()
        .mockResolvedValueOnce({ category: "escrow-milestone", confidence: 0.3 }),
      narrate: vi.fn(),
    };
    const templateEngine: IContractTemplateEnginePort = {
      listTemplates: vi.fn().mockResolvedValue([escrowTemplate]),
      render: vi.fn(),
    };
    const aikenCompiler: IAikenCompilerPort = {
      ensureProject: vi.fn().mockResolvedValue(undefined),
      build: vi.fn(),
      test: vi.fn(),
    };
    const emulator: IEmulatorPort = { seed: vi.fn(), run: vi.fn() };
    const chainProvider: IChainProviderPort = { computeScriptAddress: vi.fn() };
    const txBuilder: ITxBuilderPort = { buildAndSubmit: vi.fn() };
    const deploymentStore: IDeploymentStorePort = { write: vi.fn(), read: vi.fn() };

    const orchestrator = new BuildFromDescriptionUseCase(
      new ScaffoldProjectUseCase(fileSystem, registry),
      new GenerateContractUseCase(languageModel, templateEngine, new SelectTemplateUseCase()),
      new CompileUseCase(aikenCompiler, registry),
      new GenerateSdkUseCase({ generate: vi.fn() }, registry),
      new RunTestsUseCase(aikenCompiler, emulator, registry),
      new GenerateSecurityTestsUseCase(registry),
      new ReviewContractUseCase(languageModel),
      new GenerateDocsUseCase(languageModel),
      new DeployUseCase(chainProvider, txBuilder, deploymentStore, registry),
      fileSystem,
    );

    await expect(
      orchestrator.execute({
        description: "I want a token vending machine that mints NFTs on request",
        projectName: "mismatch-test",
        rootDir: "/tmp/mismatch-test",
        network: "preview",
        wallets: [],
        testScenarios: [],
      }),
    ).rejects.toThrow(LowConfidenceTemplateMatchError);

    // No project directory or file may be created for a rejected match.
    expect(fileSystem.mkdir).not.toHaveBeenCalled();
    expect(fileSystem.writeFile).not.toHaveBeenCalled();
    expect(templateEngine.render).not.toHaveBeenCalled();
  });
});
