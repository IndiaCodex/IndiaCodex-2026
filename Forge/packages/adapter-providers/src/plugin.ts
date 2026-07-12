import {
  IChainProviderPortToken,
  IDeploymentStorePortToken,
  ITxBuilderPortToken,
} from "@forge/application";
import type { ForgePlugin } from "@forge/plugin-api";
import { ChainProviderAdapter } from "./chain-provider-adapter.js";
import { LocalDeploymentStore } from "./local-deployment-store.js";
import { NotImplementedTxBuilder } from "./tx-builder-stub.js";

export function createProvidersPlugin(): ForgePlugin {
  return {
    name: "@forge/adapter-providers",
    version: "0.0.0",
    register: (context) => {
      context.bindPort(IChainProviderPortToken, new ChainProviderAdapter());
      context.bindPort(ITxBuilderPortToken, new NotImplementedTxBuilder());
      context.bindPort(
        IDeploymentStorePortToken,
        new LocalDeploymentStore(context.config.projectRoot),
      );
    },
  };
}
