import { IContractTemplateEnginePortToken } from "@forge/application";
import type { ForgePlugin } from "@forge/plugin-api";
import { ContractTemplateEngineAdapter } from "./template-engine-adapter.js";

export function createContractTemplatesPlugin(): ForgePlugin {
  return {
    name: "@forge/contract-templates",
    version: "0.0.0",
    register: (context) => {
      context.bindPort(IContractTemplateEnginePortToken, new ContractTemplateEngineAdapter());
    },
  };
}
