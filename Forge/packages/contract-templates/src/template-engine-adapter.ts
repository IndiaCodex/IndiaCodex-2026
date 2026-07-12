import type { ContractParameters, ContractTemplate, GeneratedContract } from "@forge/domain";
import type { IContractTemplateEnginePort } from "@forge/application";
import { renderTemplate } from "./render.js";
import { escrowMilestoneTemplate } from "./templates/escrow-milestone.js";
import { nftMintingRoyaltyTemplate } from "./templates/nft-minting-royalty.js";
import { tokenVestingTemplate } from "./templates/token-vesting.js";

const TEMPLATES: readonly ContractTemplate[] = [
  escrowMilestoneTemplate,
  nftMintingRoyaltyTemplate,
  tokenVestingTemplate,
];

export class ContractTemplateEngineAdapter implements IContractTemplateEnginePort {
  listTemplates(): Promise<readonly ContractTemplate[]> {
    return Promise.resolve(TEMPLATES);
  }

  render(templateId: string, parameters: ContractParameters): Promise<GeneratedContract> {
    const template = TEMPLATES.find((candidate) => candidate.id === templateId);
    if (!template) {
      return Promise.reject(new Error(`Unknown contract template: "${templateId}"`));
    }
    return Promise.resolve(renderTemplate(template, parameters));
  }
}
