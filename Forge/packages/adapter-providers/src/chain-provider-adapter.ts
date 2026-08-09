import type { IChainProviderPort } from "@forge/application";
import type { Network, ValidatorBlueprint } from "@forge/domain";
import { computeEnterpriseScriptAddress } from "./cip19-address.js";

export class ChainProviderAdapter implements IChainProviderPort {
  computeScriptAddress(validator: ValidatorBlueprint, network: Network): Promise<string> {
    return Promise.resolve(computeEnterpriseScriptAddress(validator.hash, network));
  }
}
