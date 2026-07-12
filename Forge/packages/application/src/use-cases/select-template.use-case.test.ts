import type { ContractTemplate } from "@forge/domain";
import { createContractIntent } from "@forge/domain";
import { describe, expect, it } from "vitest";
import {
  LowConfidenceTemplateMatchError,
  SelectTemplateUseCase,
} from "./select-template.use-case.js";

const escrowTemplate: ContractTemplate = {
  id: "escrow-milestone",
  name: "Escrow with milestone payments",
  description: "Releases funds to a beneficiary as milestones are met",
  category: "escrow-milestone",
  parameters: [],
  sourceTemplate: "validator escrow_milestone { }",
};

const vestingTemplate: ContractTemplate = {
  id: "vesting",
  name: "Time-locked vesting",
  description: "Releases funds after a deadline",
  category: "vesting",
  parameters: [],
  sourceTemplate: "validator vesting { }",
};

describe("SelectTemplateUseCase", () => {
  it("selects the template whose category exactly matches the intent", () => {
    const useCase = new SelectTemplateUseCase();
    const intent = createContractIntent({
      description: "Build an escrow smart contract with milestone-based payments",
      category: "escrow-milestone",
      confidence: 0.9,
    });

    const selection = useCase.execute(intent, [vestingTemplate, escrowTemplate]);

    expect(selection.template.id).toBe("escrow-milestone");
    expect(selection.rationale.category).toBe("template-selection");
    expect(selection.rationale.factors.some((factor) => factor.includes("exactly matches"))).toBe(
      true,
    );
  });

  it("throws when no templates are registered", () => {
    const useCase = new SelectTemplateUseCase();
    const intent = createContractIntent({
      description: "Build a vesting contract",
      category: "vesting",
      confidence: 0.8,
    });

    expect(() => useCase.execute(intent, [])).toThrow(/No contract templates/);
  });

  it("rejects instead of guessing when no template's category matches", () => {
    const useCase = new SelectTemplateUseCase();
    const intent = createContractIntent({
      description: "Build a token swap contract",
      category: "token-swap",
      confidence: 0.6,
    });

    expect(() => useCase.execute(intent, [vestingTemplate, escrowTemplate])).toThrow(
      LowConfidenceTemplateMatchError,
    );
  });

  it("reports the detected confidence, threshold, and every supported template in the error", () => {
    const useCase = new SelectTemplateUseCase();
    const intent = createContractIntent({
      description: "Build a token swap contract",
      category: "token-swap",
      confidence: 0.6,
    });

    let caught: unknown;
    try {
      useCase.execute(intent, [vestingTemplate, escrowTemplate]);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(LowConfidenceTemplateMatchError);
    const lowConfidenceError = caught as LowConfidenceTemplateMatchError;
    expect(lowConfidenceError.confidence).toBe(0);
    expect(lowConfidenceError.threshold).toBe(0.6);
    expect(lowConfidenceError.availableTemplates).toEqual([vestingTemplate, escrowTemplate]);
    expect(lowConfidenceError.message).toContain("0.00");
    expect(lowConfidenceError.message).toContain("0.60");
    expect(lowConfidenceError.message).toContain("Supported Smart Contract Templates");
    expect(lowConfidenceError.message).toContain("1. Time-locked vesting");
    expect(lowConfidenceError.message).toContain("2. Escrow with milestone payments");
  });

  it("lists each template's use cases in the rejection error when declared", () => {
    const templateWithUseCases: ContractTemplate = {
      ...escrowTemplate,
      useCases: ["Freelancing", "Construction", "Project funding"],
    };
    const useCase = new SelectTemplateUseCase();
    const intent = createContractIntent({
      description: "Build a token swap contract",
      category: "token-swap",
      confidence: 0.6,
    });

    let caught: unknown;
    try {
      useCase.execute(intent, [templateWithUseCases]);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(LowConfidenceTemplateMatchError);
    const message = (caught as LowConfidenceTemplateMatchError).message;
    expect(message).toContain("1. Escrow with milestone payments");
    expect(message).toContain("Use Cases:");
    expect(message).toContain("• Freelancing");
    expect(message).toContain("• Construction");
    expect(message).toContain("• Project funding");
  });

  it("omits the Use Cases section for a template that declares none", () => {
    const useCase = new SelectTemplateUseCase();
    const intent = createContractIntent({
      description: "Build a token swap contract",
      category: "token-swap",
      confidence: 0.6,
    });

    let caught: unknown;
    try {
      useCase.execute(intent, [escrowTemplate]);
    } catch (error) {
      caught = error;
    }

    expect((caught as LowConfidenceTemplateMatchError).message).not.toContain("Use Cases:");
  });

  it("rejects a low-confidence match even when the category matches exactly", () => {
    const useCase = new SelectTemplateUseCase();
    const intent = createContractIntent({
      description: "Build an escrow, maybe",
      category: "escrow-milestone",
      confidence: 0.3,
    });

    expect(() => useCase.execute(intent, [escrowTemplate])).toThrow(
      LowConfidenceTemplateMatchError,
    );
  });

  it("respects a custom, lower minConfidence threshold", () => {
    const useCase = new SelectTemplateUseCase();
    const intent = createContractIntent({
      description: "Build an escrow, maybe",
      category: "escrow-milestone",
      confidence: 0.3,
    });

    const selection = useCase.execute(intent, [escrowTemplate], 0.2);

    expect(selection.template.id).toBe("escrow-milestone");
  });

  it("correctly disambiguates among three registered categories", () => {
    const nftTemplate: ContractTemplate = {
      id: "nft-minting-royalty",
      name: "NFT minting with royalty support",
      description: "Mints an NFT with an enforced royalty payment",
      category: "nft-minting-royalty",
      parameters: [],
      sourceTemplate: "validator nft_minting_royalty { }",
    };
    const useCase = new SelectTemplateUseCase();
    const intent = createContractIntent({
      description: "Mint an NFT collection with a 5% royalty",
      category: "nft-minting-royalty",
      confidence: 0.7,
    });

    const selection = useCase.execute(intent, [escrowTemplate, vestingTemplate, nftTemplate]);

    expect(selection.template.id).toBe("nft-minting-royalty");
  });
});
