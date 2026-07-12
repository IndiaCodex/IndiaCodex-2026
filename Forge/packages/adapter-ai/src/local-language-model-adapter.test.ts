import type { StructuredExtractionRequest } from "@forge/application";
import { createRationale } from "@forge/domain";
import { describe, expect, it } from "vitest";
import { LocalLanguageModelAdapter } from "./local-language-model-adapter.js";

const intentRequest: StructuredExtractionRequest = {
  prompt: "Build an escrow smart contract with 4 milestone-based payments",
  context: { availableCategories: ["escrow-milestone"] },
  schema: {
    type: "object",
    properties: {
      category: { type: "string" },
      confidence: { type: "number" },
    },
    required: ["category", "confidence"],
  },
};

const parameterRequest: StructuredExtractionRequest = {
  prompt: "Build an escrow smart contract with 4 milestone-based payments",
  schema: {
    type: "object",
    properties: { milestoneCount: { type: "number" } },
  },
};

describe("LocalLanguageModelAdapter", () => {
  it("dispatches an intent-shaped schema to intent classification", async () => {
    const adapter = new LocalLanguageModelAdapter();

    const result = await adapter.extractStructured(intentRequest);

    expect(result.category).toBe("escrow-milestone");
    expect(typeof result.confidence).toBe("number");
  });

  it("dispatches any other schema to parameter extraction", async () => {
    const adapter = new LocalLanguageModelAdapter();

    const result = await adapter.extractStructured(parameterRequest);

    expect(result).toEqual({ milestoneCount: 4 });
  });

  it("never produces a field resembling Aiken/Plutus source in either path", async () => {
    const adapter = new LocalLanguageModelAdapter();

    const intentResult = await adapter.extractStructured(intentRequest);
    const paramResult = await adapter.extractStructured(parameterRequest);

    for (const value of [...Object.values(intentResult), ...Object.values(paramResult)]) {
      expect(typeof value === "string" ? value : "").not.toContain("validator ");
    }
  });

  it("narrates a rationale into prose", async () => {
    const adapter = new LocalLanguageModelAdapter();
    const rationale = createRationale({
      subject: "milestoneCount",
      category: "parameter",
      decision: '"milestoneCount" = 4',
      factors: ["extracted from the description"],
    });

    const narrative = await adapter.narrate({ subject: "milestoneCount", facts: [rationale] });

    expect(narrative).toContain('"milestoneCount" = 4');
  });
});
