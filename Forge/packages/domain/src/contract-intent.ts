export interface ContractIntent {
  readonly description: string;
  readonly category: string;
  readonly confidence: number;
}

export function createContractIntent(input: {
  description: string;
  category: string;
  confidence: number;
}): ContractIntent {
  if (input.description.trim().length === 0) {
    throw new Error("ContractIntent requires a non-empty description");
  }
  if (input.category.trim().length === 0) {
    throw new Error("ContractIntent requires a non-empty category");
  }
  return {
    description: input.description,
    category: input.category,
    confidence: Math.min(1, Math.max(0, input.confidence)),
  };
}
