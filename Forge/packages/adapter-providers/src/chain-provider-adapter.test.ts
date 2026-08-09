import type { ValidatorBlueprint } from "@forge/domain";
import { describe, expect, it } from "vitest";
import { ChainProviderAdapter } from "./chain-provider-adapter.js";

const validator: ValidatorBlueprint = {
  title: "escrow_milestone.escrow_milestone.spend",
  redeemer: { schema: {} },
  compiledCode: "590a",
  hash: "4486d627a370e46712a13da34221f864c4bab449e7d13884926342b7",
};

describe("ChainProviderAdapter", () => {
  it("computes a real bech32 address from the validator's script hash", async () => {
    const adapter = new ChainProviderAdapter();

    const address = await adapter.computeScriptAddress(validator, "preview");

    expect(address.startsWith("addr_test1")).toBe(true);
  });
});
