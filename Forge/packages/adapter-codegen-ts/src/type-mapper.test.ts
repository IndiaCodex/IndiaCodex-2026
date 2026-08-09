import { describe, expect, it } from "vitest";
import { escrowBlueprintFixture } from "./fixtures.js";
import { generateNamedTypeDeclarations, typeExpressionFor } from "./type-mapper.js";

describe("typeExpressionFor", () => {
  it("resolves a $ref pointing at a single-constructor record to its interface name", () => {
    const validator = escrowBlueprintFixture.validators[0]!;
    const expression = typeExpressionFor(escrowBlueprintFixture, validator.datum!.schema);

    expect(expression).toBe("EscrowDatum");
  });

  it("resolves a $ref pointing at a multi-constructor enum to its union type name", () => {
    const validator = escrowBlueprintFixture.validators[0]!;
    const expression = typeExpressionFor(escrowBlueprintFixture, validator.redeemer.schema);

    expect(expression).toBe("EscrowRedeemer");
  });

  it("resolves an integer $ref to a plain TS number", () => {
    const expression = typeExpressionFor(escrowBlueprintFixture, { $ref: "#/definitions/Int" });

    expect(expression).toBe("number");
  });
});

describe("generateNamedTypeDeclarations", () => {
  it("emits an interface for the single-constructor EscrowDatum", () => {
    const declarations = generateNamedTypeDeclarations(escrowBlueprintFixture);

    expect(declarations).toContain("export interface EscrowDatum {");
    expect(declarations).toContain("beneficiary: string;");
    expect(declarations).toContain("milestones_completed: number;");
  });

  it("emits a tagged union type for the multi-constructor EscrowRedeemer", () => {
    const declarations = generateNamedTypeDeclarations(escrowBlueprintFixture);

    expect(declarations).toContain("export type EscrowRedeemer =");
    expect(declarations).toContain('{ kind: "CompleteMilestone" }');
    expect(declarations).toContain('{ kind: "Cancel" }');
  });

  it("does not emit a declaration for plain primitive definitions like Int", () => {
    const declarations = generateNamedTypeDeclarations(escrowBlueprintFixture);

    expect(declarations).not.toContain("interface Int");
    expect(declarations).not.toContain("type Int");
  });
});
