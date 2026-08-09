import { describe, expect, it } from "vitest";
import { NotImplementedTxBuilder } from "./tx-builder-stub.js";

describe("NotImplementedTxBuilder", () => {
  it("rejects clearly rather than silently pretending to submit a transaction", async () => {
    const builder = new NotImplementedTxBuilder();

    await expect(
      builder.buildAndSubmit({ network: "preview", description: "seed", payload: {} }),
    ).rejects.toThrow(/No real transaction-building pipeline/);
  });
});
