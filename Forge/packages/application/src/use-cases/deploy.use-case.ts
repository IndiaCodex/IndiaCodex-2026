import type { DeploymentManifest, Network, Project, ValidatorBlueprint } from "@forge/domain";
import type { IChainProviderPort } from "../ports/chain-provider.port.js";
import type { IDeploymentStorePort } from "../ports/deployment-store.port.js";
import type { ITxBuilderPort, TransactionRequest } from "../ports/tx-builder.port.js";
import type { PlatformRegistry } from "../registry/platform-registry.js";

export interface DeployInput {
  readonly project: Project;
  readonly validator: ValidatorBlueprint;
  readonly network: Network;
  readonly blueprintHash: string;
  readonly setupTransactions?: readonly TransactionRequest[];
}

export class DeployUseCase {
  constructor(
    private readonly chainProvider: IChainProviderPort,
    private readonly txBuilder: ITxBuilderPort,
    private readonly deploymentStore: IDeploymentStorePort,
    private readonly registry: PlatformRegistry,
  ) {}

  async execute(input: DeployInput): Promise<DeploymentManifest> {
    const { project, validator, network, blueprintHash } = input;
    await this.registry.fireHook("beforeDeploy", { project, network });

    const address = await this.chainProvider.computeScriptAddress(validator, network);

    const setupTxHashes: string[] = [];
    for (const request of input.setupTransactions ?? []) {
      setupTxHashes.push(await this.txBuilder.buildAndSubmit(request));
    }

    const manifest: DeploymentManifest = {
      network,
      validatorTitle: validator.title,
      scriptHash: validator.hash,
      address,
      deployedAt: new Date().toISOString(),
      blueprintHash,
      setupTxHashes,
    };

    await this.deploymentStore.write(manifest);
    await this.registry.fireHook("afterDeploy", { project, manifest });
    return manifest;
  }
}
