import type { ContractParameters } from "./contract-parameters.js";

export interface GeneratedContract {
  readonly templateId: string;
  readonly parameters: ContractParameters;
  readonly source: string;
  readonly fileName: string;
}
