import { describe, expect, it } from "vitest";
import { createContractIntent } from "./contract-intent.js";

describe("createContractIntent", () => {
  it("creates an intent with a valid confidence score", () => {
    const intent = createContractIntent({
      description: "Build an escrow smart contract with milestone-based payments",
      category: "escrow-milestone",
      confidence: 0.87,
    });

    expect(intent.category).toBe("escrow-milestone");
    expect(intent.confidence).toBe(0.87);
  });

  it("clamps a confidence score above 1", () => {
    const intent = createContractIntent({
      description: "Build a vesting contract",
      category: "vesting",
      confidence: 1.5,
    });

    expect(intent.confidence).toBe(1);
  });

  it("clamps a confidence score below 0", () => {
    const intent = createContractIntent({
      description: "Build a vesting contract",
      category: "vesting",
      confidence: -0.2,
    });

    expect(intent.confidence).toBe(0);
  });

  it("rejects an empty description", () => {
    expect(() =>
      createContractIntent({ description: "", category: "escrow-milestone", confidence: 0.9 }),
    ).toThrow(/non-empty description/);
  });

  it("rejects an empty category", () => {
    expect(() =>
      createContractIntent({
        description: "Build an escrow contract",
        category: "",
        confidence: 0.9,
      }),
    ).toThrow(/non-empty category/);
  });
});
