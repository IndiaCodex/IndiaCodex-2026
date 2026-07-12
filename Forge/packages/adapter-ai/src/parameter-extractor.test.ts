import type { JsonSchema } from "@forge/application";
import { describe, expect, it } from "vitest";
import { extractParameters } from "./parameter-extractor.js";

const schema: JsonSchema = {
  type: "object",
  properties: {
    milestoneCount: { type: "number", description: "How many milestones" },
  },
  required: ["milestoneCount"],
};

describe("extractParameters", () => {
  it("extracts a numeric parameter when a number is present", () => {
    const result = extractParameters(
      "Build an escrow smart contract with 4 milestone-based payments",
      schema,
    );

    expect(result).toEqual({ milestoneCount: 4 });
  });

  it("leaves the parameter unset when no number is present in the description", () => {
    const result = extractParameters(
      "Build an escrow smart contract with milestone-based payments",
      schema,
    );

    expect(result).toEqual({});
  });

  it("never invents a value for a non-numeric property", () => {
    const stringSchema: JsonSchema = {
      type: "object",
      properties: { beneficiary: { type: "string", description: "address" } },
    };

    const result = extractParameters("Build an escrow for addr_test1abc", stringSchema);

    expect(result).toEqual({});
  });
});
