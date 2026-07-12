import type { ContractTemplate } from "@forge/domain";
import { describe, expect, it } from "vitest";
import { renderTemplate, TemplateRenderError } from "./render.js";
import { nftMintingRoyaltyTemplate } from "./templates/nft-minting-royalty.js";
import { tokenVestingTemplate } from "./templates/token-vesting.js";

const template: ContractTemplate = {
  id: "escrow-milestone",
  name: "Escrow with milestone payments",
  description: "test template",
  category: "escrow-milestone",
  parameters: [
    {
      name: "milestoneCount",
      type: "number",
      description: "milestone count",
      required: true,
      defaultValue: 3,
    },
  ],
  sourceTemplate: "const milestone_count: Int = {{milestoneCount}}\n",
};

describe("renderTemplate", () => {
  it("substitutes a provided parameter into the source", () => {
    const contract = renderTemplate(template, { milestoneCount: 5 });

    expect(contract.source).toContain("const milestone_count: Int = 5");
    expect(contract.templateId).toBe("escrow-milestone");
    expect(contract.fileName).toBe("escrow_milestone.ak");
  });

  it("falls back to the parameter's default when not provided", () => {
    const contract = renderTemplate(template, {});

    expect(contract.source).toContain("const milestone_count: Int = 3");
  });

  it("throws TemplateRenderError when a required parameter has no value or default", () => {
    const noDefaultTemplate: ContractTemplate = {
      ...template,
      parameters: [{ ...template.parameters[0]!, defaultValue: undefined }],
    };

    expect(() => renderTemplate(noDefaultTemplate, {})).toThrow(TemplateRenderError);
  });

  it("throws TemplateRenderError if a placeholder is left unresolved", () => {
    const brokenTemplate: ContractTemplate = { ...template, parameters: [] };

    expect(() => renderTemplate(brokenTemplate, {})).toThrow(/unresolved placeholder/);
  });
});

describe("renderTemplate against the real registered templates", () => {
  it("renders nft-minting-royalty with its defaults", () => {
    const contract = renderTemplate(nftMintingRoyaltyTemplate, {});

    expect(contract.fileName).toBe("nft_minting_royalty.ak");
    expect(contract.source).toContain('const asset_name: AssetName = "ForgeNFT"');
    expect(contract.source).toContain("const royalty_percent: Int = 5");
    expect(contract.source).toContain("const mint_price_lovelace: Int = 100000000");
    expect(contract.source).toContain(
      `const royalty_beneficiary: ByteArray = #"${"0".repeat(56)}"`,
    );
    expect(contract.source).not.toMatch(/\{\{\s*[\w.]+\s*\}\}/);
  });

  it("renders nft-minting-royalty with overridden parameters", () => {
    const contract = renderTemplate(nftMintingRoyaltyTemplate, {
      royaltyPercent: 10,
      mintPriceLovelace: 50_000_000,
      assetName: "MoonRunner001",
    });

    expect(contract.source).toContain("const royalty_percent: Int = 10");
    expect(contract.source).toContain("const mint_price_lovelace: Int = 50000000");
    expect(contract.source).toContain('const asset_name: AssetName = "MoonRunner001"');
  });

  it("renders token-vesting with its defaults", () => {
    const contract = renderTemplate(tokenVestingTemplate, {});

    expect(contract.fileName).toBe("token_vesting.ak");
    expect(contract.source).toContain("const vesting_periods: Int = 4");
    expect(contract.source).toContain("const period_duration_ms: Int = 2592000000");
    expect(contract.source).toContain("const vesting_start_ms: Int = 0");
    expect(contract.source).not.toMatch(/\{\{\s*[\w.]+\s*\}\}/);
  });

  it("renders token-vesting with an overridden period count", () => {
    const contract = renderTemplate(tokenVestingTemplate, { vestingPeriods: 12 });

    expect(contract.source).toContain("const vesting_periods: Int = 12");
  });
});
