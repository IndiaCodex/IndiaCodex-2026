import type { Blueprint, GeneratedContract, Rationale } from "@forge/domain";
import { createRationale } from "@forge/domain";
import { describe, expect, it, vi } from "vitest";
import type { ILanguageModelPort } from "../ports/language-model.port.js";
import { ReviewContractUseCase } from "./review-contract.use-case.js";

const blueprint: Blueprint = {
  preamble: { title: "escrow", version: "1.0.0", plutusVersion: "v3" },
  validators: [],
  definitions: {},
};

const contract: GeneratedContract = {
  templateId: "escrow-milestone",
  parameters: {},
  source: "validator escrow_milestone { }",
  fileName: "escrow_milestone.ak",
};

describe("ReviewContractUseCase", () => {
  it("passes the recorded rationales as the facts to narrate, not independent judgment", async () => {
    const rationale: Rationale = createRationale({
      subject: "escrow-milestone",
      category: "template-selection",
      decision: "Selected template",
      factors: ["exact category match"],
    });
    const narrate = vi.fn().mockResolvedValue("This contract follows the standard escrow pattern.");
    const languageModel: ILanguageModelPort = { extractStructured: vi.fn(), narrate };

    const useCase = new ReviewContractUseCase(languageModel);
    const report = await useCase.execute({ contract, blueprint, rationales: [rationale] });

    expect(narrate).toHaveBeenCalledWith({
      subject: "review of escrow_milestone.ak",
      facts: [rationale],
    });
    expect(report.observations).toEqual([
      { summary: "This contract follows the standard escrow pattern." },
    ]);
  });
});
