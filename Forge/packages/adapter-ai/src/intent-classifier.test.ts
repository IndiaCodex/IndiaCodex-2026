import { describe, expect, it } from "vitest";
import { classifyIntent } from "./intent-classifier.js";

describe("classifyIntent", () => {
  it("matches the escrow-milestone category for the canonical demo description", () => {
    const intent = classifyIntent("Build an escrow smart contract with milestone-based payments", [
      "escrow-milestone",
    ]);

    expect(intent.category).toBe("escrow-milestone");
    expect(intent.confidence).toBeGreaterThan(0.5);
  });

  it("gives higher confidence to descriptions matching more keywords", () => {
    const weak = classifyIntent("Build an escrow contract", ["escrow-milestone"]);
    const strong = classifyIntent(
      "Build an escrow contract with milestones released in installments",
      ["escrow-milestone"],
    );

    expect(strong.confidence).toBeGreaterThan(weak.confidence);
  });

  it("falls back to the first available category at low confidence when nothing matches", () => {
    const intent = classifyIntent("Build a token swap contract", ["escrow-milestone"]);

    expect(intent.category).toBe("escrow-milestone");
    expect(intent.confidence).toBe(0.3);
  });

  it("throws when no categories are available at all", () => {
    expect(() => classifyIntent("Build anything", [])).toThrow(/No template categories/);
  });

  const categories = ["escrow-milestone", "nft-minting-royalty", "token-vesting"];

  it("classifies an NFT minting description correctly among all three categories", () => {
    const intent = classifyIntent(
      "Mint an NFT collection with a 5% royalty on every sale",
      categories,
    );

    expect(intent.category).toBe("nft-minting-royalty");
    expect(intent.confidence).toBeGreaterThan(0.5);
  });

  it("classifies a token vesting description correctly among all three categories", () => {
    const intent = classifyIntent(
      "Create a token vesting contract with a 4-period unlock schedule",
      categories,
    );

    expect(intent.category).toBe("token-vesting");
    expect(intent.confidence).toBeGreaterThan(0.5);
  });

  it("still classifies escrow correctly now that other categories are registered", () => {
    const intent = classifyIntent(
      "Build an escrow smart contract with milestone-based payments",
      categories,
    );

    expect(intent.category).toBe("escrow-milestone");
    expect(intent.confidence).toBeGreaterThan(0.5);
  });
});
