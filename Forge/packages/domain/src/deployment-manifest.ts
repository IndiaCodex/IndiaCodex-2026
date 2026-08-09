import type { Network } from "./network.js";

export interface DeploymentManifest {
  readonly network: Network;
  readonly validatorTitle: string;
  readonly scriptHash: string;
  readonly address: string;
  readonly deployedAt: string;
  readonly blueprintHash: string;
  readonly setupTxHashes: readonly string[];
}
