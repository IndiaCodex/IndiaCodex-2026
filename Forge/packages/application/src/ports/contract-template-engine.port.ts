import type { ContractParameters, ContractTemplate, GeneratedContract } from "@forge/domain";
import { createPortToken } from "@forge/plugin-api";
import type { PortToken } from "@forge/plugin-api";

/**
 * The Forge Engine: the only component in the platform that ever produces
 * Aiken source. Rendering is a deterministic substitution of validated
 * parameters into an audited template — never a language-model call.
 */
export interface IContractTemplateEnginePort {
  listTemplates(): Promise<readonly ContractTemplate[]>;
  render(templateId: string, parameters: ContractParameters): Promise<GeneratedContract>;
}

export const IContractTemplateEnginePortToken: PortToken<IContractTemplateEnginePort> =
  createPortToken<IContractTemplateEnginePort>("IContractTemplateEnginePort");
