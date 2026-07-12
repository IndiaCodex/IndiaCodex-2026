import type { DeploymentManifest, Network } from "@forge/domain";
import { createPortToken } from "@forge/plugin-api";
import type { PortToken } from "@forge/plugin-api";

export interface IDeploymentStorePort {
  write(manifest: DeploymentManifest): Promise<void>;
  read(network: Network, validatorTitle: string): Promise<DeploymentManifest | undefined>;
}

export const IDeploymentStorePortToken: PortToken<IDeploymentStorePort> =
  createPortToken<IDeploymentStorePort>("IDeploymentStorePort");
