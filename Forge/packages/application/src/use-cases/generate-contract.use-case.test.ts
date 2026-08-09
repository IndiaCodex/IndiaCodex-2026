import type { ContractTemplate, GeneratedContract } from "@forge/domain";
import { describe, expect, it, vi } from "vitest";
import type { IContractTemplateEnginePort } from "../ports/contract-template-engine.port.js";
import type { ILanguageModelPort } from "../ports/language-model.port.js";
import { GenerateContractUseCase } from "./generate-contract.use-case.js";
import {
  LowConfidenceTemplateMatchError,
  SelectTemplateUseCase,
} from "./select-template.use-case.js";

const escrowTemplate: ContractTemplate = {
  id: "escrow-milestone",
  name: "Escrow with milestone payments",
  description: "Releases funds to a beneficiary as milestones are met",
  category: "escrow-milestone",
  parameters: [
    {
      name: "milestoneCount",
      type: "number",
      description: "How many milestones the escrow is split into",
      required: true,
      defaultValue: 3,
    },
    {
      name: "beneficiary",
      type: "address",
      description: "The address receiving each milestone payment",
      required: true,
    },
  ],
  sourceTemplate: "validator escrow_milestone(milestone_count: Int, beneficiary: Address) { }",
};

describe("GenerateContractUseCase", () => {
  it("never lets the language model produce contract source — only intent and parameters", async () => {
    const extractStructured = vi
      .fn<ILanguageModelPort["extractStructured"]>()
      .mockResolvedValueOnce({ category: "escrow-milestone", confidence: 0.92 })
      .mockResolvedValueOnce({ milestoneCount: 4, beneficiary: "addr_test1abc" });

    const languageModel: ILanguageModelPort = {
      extractStructured,
      narrate: vi.fn(),
    };

    const renderedContract: GeneratedContract = {
      templateId: "escrow-milestone",
      parameters: { milestoneCount: 4, beneficiary: "addr_test1abc" },
      source: "validator escrow_milestone(milestone_count: Int, beneficiary: Address) { }",
      fileName: "escrow_milestone.ak",
    };
    const templateEngine: IContractTemplateEnginePort = {
      listTemplates: vi.fn().mockResolvedValue([escrowTemplate]),
      render: vi.fn().mockResolvedValue(renderedContract),
    };

    const useCase = new GenerateContractUseCase(
      languageModel,
      templateEngine,
      new SelectTemplateUseCase(),
    );

    const result = await useCase.execute(
      "Build an escrow smart contract with 4 milestone-based payments to addr_test1abc",
    );

    expect(result.contract).toBe(renderedContract);
    expect(result.templateRationale.subject).toBe("escrow-milestone");
    expect(result.parameterRationales).toHaveLength(2);
    expect(templateEngine.render).toHaveBeenCalledWith("escrow-milestone", {
      milestoneCount: 4,
      beneficiary: "addr_test1abc",
    });
    // The language model is called exactly twice: intent, then parameters.
    // It is never asked to produce Aiken source directly.
    expect(extractStructured).toHaveBeenCalledTimes(2);
  });

  it("falls back to a required parameter's default when extraction omits it", async () => {
    const languageModel: ILanguageModelPort = {
      extractStructured: vi
        .fn<ILanguageModelPort["extractStructured"]>()
        .mockResolvedValueOnce({ category: "escrow-milestone", confidence: 0.8 })
        .mockResolvedValueOnce({ beneficiary: "addr_test1abc" }),
      narrate: vi.fn(),
    };
    const renderedContract: GeneratedContract = {
      templateId: "escrow-milestone",
      parameters: { milestoneCount: 3, beneficiary: "addr_test1abc" },
      source: "validator escrow_milestone(...) { }",
      fileName: "escrow_milestone.ak",
    };
    const templateEngine: IContractTemplateEnginePort = {
      listTemplates: vi.fn().mockResolvedValue([escrowTemplate]),
      render: vi.fn().mockResolvedValue(renderedContract),
    };

    const useCase = new GenerateContractUseCase(
      languageModel,
      templateEngine,
      new SelectTemplateUseCase(),
    );

    const result = await useCase.execute("Build an escrow contract for addr_test1abc");

    expect(templateEngine.render).toHaveBeenCalledWith("escrow-milestone", {
      milestoneCount: 3,
      beneficiary: "addr_test1abc",
    });
    expect(
      result.parameterRationales.find((rationale) => rationale.subject === "milestoneCount")
        ?.factors[0],
    ).toContain("template default");
  });

  it("rejects a low-confidence match before extracting parameters or rendering", async () => {
    const extractStructured = vi
      .fn<ILanguageModelPort["extractStructured"]>()
      .mockResolvedValueOnce({ category: "escrow-milestone", confidence: 0.3 });

    const languageModel: ILanguageModelPort = {
      extractStructured,
      narrate: vi.fn(),
    };
    const templateEngine: IContractTemplateEnginePort = {
      listTemplates: vi.fn().mockResolvedValue([escrowTemplate]),
      render: vi.fn(),
    };

    const useCase = new GenerateContractUseCase(
      languageModel,
      templateEngine,
      new SelectTemplateUseCase(),
    );

    await expect(
      useCase.execute("I want a token vending machine that mints NFTs on request"),
    ).rejects.toThrow(LowConfidenceTemplateMatchError);

    // Parameter extraction (the second extractStructured call) and
    // rendering must never happen for a rejected match.
    expect(extractStructured).toHaveBeenCalledTimes(1);
    expect(templateEngine.render).not.toHaveBeenCalled();
  });

  it("accepts a custom minConfidence threshold", async () => {
    const languageModel: ILanguageModelPort = {
      extractStructured: vi
        .fn<ILanguageModelPort["extractStructured"]>()
        .mockResolvedValueOnce({ category: "escrow-milestone", confidence: 0.3 })
        .mockResolvedValueOnce({ beneficiary: "addr_test1abc" }),
      narrate: vi.fn(),
    };
    const renderedContract: GeneratedContract = {
      templateId: "escrow-milestone",
      parameters: { milestoneCount: 3, beneficiary: "addr_test1abc" },
      source: "validator escrow_milestone(...) { }",
      fileName: "escrow_milestone.ak",
    };
    const templateEngine: IContractTemplateEnginePort = {
      listTemplates: vi.fn().mockResolvedValue([escrowTemplate]),
      render: vi.fn().mockResolvedValue(renderedContract),
    };

    const useCase = new GenerateContractUseCase(
      languageModel,
      templateEngine,
      new SelectTemplateUseCase(),
    );

    const result = await useCase.execute("Build an escrow contract for addr_test1abc", 0.2);

    expect(result.contract).toBe(renderedContract);
  });

  it("throws when no templates are registered", async () => {
    const languageModel: ILanguageModelPort = {
      extractStructured: vi.fn(),
      narrate: vi.fn(),
    };
    const templateEngine: IContractTemplateEnginePort = {
      listTemplates: vi.fn().mockResolvedValue([]),
      render: vi.fn(),
    };
    const useCase = new GenerateContractUseCase(
      languageModel,
      templateEngine,
      new SelectTemplateUseCase(),
    );

    await expect(useCase.execute("Build anything")).rejects.toThrow(/No contract templates/);
  });
});
