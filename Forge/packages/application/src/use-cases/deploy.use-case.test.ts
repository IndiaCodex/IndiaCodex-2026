import type { ValidatorBlueprint } from "@forge/domain";
import type { Logger } from "@forge/plugin-api";
import { describe, expect, it, vi } from "vitest";
import type { IChainProviderPort } from "../ports/chain-provider.port.js";
import type { IDeploymentStorePort } from "../ports/deployment-store.port.js";
import type { ITxBuilderPort } from "../ports/tx-builder.port.js";
import { PlatformRegistry } from "../registry/platform-registry.js";
import { DeployUseCase } from "./deploy.use-case.js";

function createSilentLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

const validator: ValidatorBlueprint = {
  title: "escrow.spend",
  redeemer: { schema: { title: "Action" } },
  compiledCode: "590a",
  hash: "abc123",
};

describe("DeployUseCase", () => {
  it("computes the address, persists a manifest, and fires deploy hooks", async () => {
    const chainProvider: IChainProviderPort = {
      computeScriptAddress: vi.fn().mockResolvedValue("addr_test1..."),
    };
    const txBuilder: ITxBuilderPort = { buildAndSubmit: vi.fn() };
    const deploymentStore: IDeploymentStorePort = {
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn(),
    };
    const registry = new PlatformRegistry(createSilentLogger());
    const events: string[] = [];
    registry.onHook("beforeDeploy", ({ network }) => {
      events.push(`before:${network}`);
    });
    registry.onHook("afterDeploy", ({ manifest }) => {
      events.push(`after:${manifest.address}`);
    });

    const useCase = new DeployUseCase(chainProvider, txBuilder, deploymentStore, registry);
    const project = { name: "escrow-demo", rootDir: "/tmp/escrow-demo" };
    const manifest = await useCase.execute({
      project,
      validator,
      network: "preview",
      blueprintHash: "blueprint-hash-1",
    });

    expect(manifest.address).toBe("addr_test1...");
    expect(manifest.setupTxHashes).toEqual([]);
    expect(txBuilder.buildAndSubmit).not.toHaveBeenCalled();
    expect(deploymentStore.write).toHaveBeenCalledWith(manifest);
    expect(events).toEqual(["before:preview", "after:addr_test1..."]);
  });

  it("submits setup transactions when provided", async () => {
    const chainProvider: IChainProviderPort = {
      computeScriptAddress: vi.fn().mockResolvedValue("addr_test1..."),
    };
    const txBuilder: ITxBuilderPort = {
      buildAndSubmit: vi.fn().mockResolvedValue("txhash1"),
    };
    const deploymentStore: IDeploymentStorePort = {
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn(),
    };
    const registry = new PlatformRegistry(createSilentLogger());

    const useCase = new DeployUseCase(chainProvider, txBuilder, deploymentStore, registry);
    const manifest = await useCase.execute({
      project: { name: "escrow-demo", rootDir: "/tmp/escrow-demo" },
      validator,
      network: "preview",
      blueprintHash: "blueprint-hash-1",
      setupTransactions: [{ network: "preview", description: "seed", payload: {} }],
    });

    expect(manifest.setupTxHashes).toEqual(["txhash1"]);
  });
});
