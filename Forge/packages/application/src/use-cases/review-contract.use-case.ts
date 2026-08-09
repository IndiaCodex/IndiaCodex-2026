import type { Blueprint, GeneratedContract, Rationale, ReviewReport } from "@forge/domain";
import type { ILanguageModelPort } from "../ports/language-model.port.js";

export interface ReviewContractInput {
  readonly contract: GeneratedContract;
  readonly blueprint: Blueprint;
  readonly rationales: readonly Rationale[];
}

/**
 * Grounded in the same deterministic facts ai-testgen and the generation
 * pipeline already produced (`rationales`) — the language model organizes
 * and narrates them into a review, it does not form independent judgments
 * about security.
 */
export class ReviewContractUseCase {
  constructor(private readonly languageModel: ILanguageModelPort) {}

  async execute(input: ReviewContractInput): Promise<ReviewReport> {
    const summary = await this.languageModel.narrate({
      subject: `review of ${input.contract.fileName}`,
      facts: input.rationales,
    });

    return {
      observations: [{ summary }],
    };
  }
}
