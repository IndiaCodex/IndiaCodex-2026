import { describe, expect, it } from "vitest";
import { ContractTemplateEngineAdapter } from "./template-engine-adapter.js";

describe("ContractTemplateEngineAdapter", () => {
  it("lists all three registered templates", async () => {
    const adapter = new ContractTemplateEngineAdapter();

    const templates = await adapter.listTemplates();

    expect(templates.map((template) => template.id)).toEqual([
      "escrow-milestone",
      "nft-minting-royalty",
      "token-vesting",
    ]);
  });

  it("renders the escrow-milestone template with a given milestone count", async () => {
    const adapter = new ContractTemplateEngineAdapter();

    const contract = await adapter.render("escrow-milestone", { milestoneCount: 4 });

    expect(contract.source).toContain("const milestone_count: Int = 4");
    expect(contract.source).toContain("validator escrow_milestone");
  });

  it("renders the nft-minting-royalty template with a given royalty percent", async () => {
    const adapter = new ContractTemplateEngineAdapter();

    const contract = await adapter.render("nft-minting-royalty", { royaltyPercent: 7 });

    expect(contract.source).toContain("const royalty_percent: Int = 7");
    expect(contract.source).toContain("validator nft_minting_royalty");
  });

  it("renders the token-vesting template with a given vesting period count", async () => {
    const adapter = new ContractTemplateEngineAdapter();

    const contract = await adapter.render("token-vesting", { vestingPeriods: 6 });

    expect(contract.source).toContain("const vesting_periods: Int = 6");
    expect(contract.source).toContain("validator token_vesting");
  });

  it("rejects an unknown template id", async () => {
    const adapter = new ContractTemplateEngineAdapter();

    await expect(adapter.render("no-such-template", {})).rejects.toThrow(
      /Unknown contract template/,
    );
  });
});
