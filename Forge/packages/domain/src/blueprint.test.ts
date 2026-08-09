import { describe, expect, it } from "vitest";
import { findValidator, resolveSchemaRef } from "./blueprint.js";
import type { Blueprint } from "./blueprint.js";

const blueprint: Blueprint = {
  preamble: { title: "escrow-demo", version: "0.0.0", plutusVersion: "v3" },
  validators: [
    {
      title: "escrow_milestone.escrow_milestone.spend",
      datum: { title: "datum", schema: { $ref: "#/definitions/escrow_milestone~1EscrowDatum" } },
      redeemer: {
        title: "redeemer",
        schema: { $ref: "#/definitions/escrow_milestone~1EscrowRedeemer" },
      },
      compiledCode: "590a...",
      hash: "abc123",
    },
  ],
  definitions: {
    "escrow_milestone/EscrowDatum": {
      title: "EscrowDatum",
      anyOf: [
        {
          title: "EscrowDatum",
          dataType: "constructor",
          index: 0,
          fields: [{ title: "beneficiary" }, { title: "milestones_completed" }],
        },
      ],
    },
    "escrow_milestone/EscrowRedeemer": {
      title: "EscrowRedeemer",
      anyOf: [
        { title: "CompleteMilestone", dataType: "constructor", index: 0, fields: [] },
        { title: "Cancel", dataType: "constructor", index: 1, fields: [] },
      ],
    },
  },
};

describe("findValidator", () => {
  it("finds a validator by title", () => {
    const validator = findValidator(blueprint, "escrow_milestone.escrow_milestone.spend");

    expect(validator).toBeDefined();
    expect(validator?.hash).toBe("abc123");
  });

  it("returns undefined for an unknown title", () => {
    expect(findValidator(blueprint, "escrow_milestone.escrow_milestone.mint")).toBeUndefined();
  });
});

describe("resolveSchemaRef", () => {
  it("resolves a $ref, unescaping the JSON Pointer '/' encoding", () => {
    const resolved = resolveSchemaRef(blueprint, "#/definitions/escrow_milestone~1EscrowDatum");

    expect(resolved?.title).toBe("EscrowDatum");
    expect(resolved?.anyOf?.[0]?.fields).toHaveLength(2);
  });

  it("returns undefined for a ref outside #/definitions", () => {
    expect(resolveSchemaRef(blueprint, "#/somewhere/else")).toBeUndefined();
  });

  it("returns undefined when the definition does not exist", () => {
    expect(resolveSchemaRef(blueprint, "#/definitions/Nonexistent")).toBeUndefined();
  });
});
