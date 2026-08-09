import { describe, expect, it } from "vitest";
import { escrowBlueprintFixture } from "./fixtures.js";
import { generateSdkModule } from "./sdk-module-generator.js";

describe("generateSdkModule", () => {
  it("generates named types plus a typed Datum/Redeemer alias and metadata per validator", () => {
    const generated = generateSdkModule(escrowBlueprintFixture);

    expect(generated).toContain("export interface EscrowDatum {");
    expect(generated).toContain("export type EscrowRedeemer =");
    expect(generated).toContain("export type EscrowMilestoneSpendDatum = EscrowDatum;");
    expect(generated).toContain("export type EscrowMilestoneSpendRedeemer = EscrowRedeemer;");
    expect(generated).toContain("export const escrowMilestoneSpendValidator = {");
    expect(generated).toContain('title: "escrow_milestone.escrow_milestone.spend"');
    expect(generated).toContain('hash: "4486d627a370e46712a13da34221f864c4bab449e7d13884926342b7"');
  });

  it("is valid enough TypeScript to at least be free of unbalanced braces", () => {
    const generated = generateSdkModule(escrowBlueprintFixture);
    const openBraces = (generated.match(/\{/g) ?? []).length;
    const closeBraces = (generated.match(/\}/g) ?? []).length;

    expect(openBraces).toBe(closeBraces);
  });
});
