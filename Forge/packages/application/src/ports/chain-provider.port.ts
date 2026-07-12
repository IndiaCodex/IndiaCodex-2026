import type { Network, ValidatorBlueprint } from "@forge/domain";
import { createPortToken } from "@forge/plugin-api";
import type { PortToken } from "@forge/plugin-api";

export interface IChainProviderPort {
  computeScriptAddress(validator: ValidatorBlueprint, network: Network): Promise<string>;
}

export const IChainProviderPortToken: PortToken<IChainProviderPort> =
  createPortToken<IChainProviderPort>("IChainProviderPort");
