import { describe, expect, it } from "vitest";
import {
  buildBorrowRedeemer,
  buildCloseRedeemer,
  buildHarvestRedeemer,
  buildRepayRedeemer,
  buildTierDatum,
  buildVaultDatum,
} from "../src/tx/datums";

describe("buildTierDatum", () => {
  it("encodes Bronze/Silver/Gold at their verified constructor indices", () => {
    expect(buildTierDatum("Bronze")).toMatchObject({ constructor: 0 });
    expect(buildTierDatum("Silver")).toMatchObject({ constructor: 1 });
    expect(buildTierDatum("Gold")).toMatchObject({ constructor: 2 });
  });
});

describe("buildVaultDatum", () => {
  it("encodes fields in VaultDatum's declared order", () => {
    const datum = buildVaultDatum({
      ownerVkh: "aa".repeat(28),
      principalTusdm: 200_000_000,
      collateralLovelace: 1_000_000_000,
      tierAtOpen: "Bronze",
    });
    expect(datum.constructor).toBe(0);
    expect(datum.fields).toHaveLength(4);
    expect(datum.fields[1]).toMatchObject({ int: 200_000_000 });
    expect(datum.fields[2]).toMatchObject({ int: 1_000_000_000 });
  });
});

describe("VaultRedeemer encoders", () => {
  it("Borrow is constructor 0 with no fields", () => {
    expect(buildBorrowRedeemer()).toMatchObject({ constructor: 0, fields: [] });
  });

  it("Repay is constructor 1 carrying the amount", () => {
    const r = buildRepayRedeemer(100_000_000);
    expect(r.constructor).toBe(1);
    expect(r.fields[0]).toMatchObject({ int: 100_000_000 });
  });

  it("Harvest is constructor 2 with no fields", () => {
    expect(buildHarvestRedeemer()).toMatchObject({ constructor: 2, fields: [] });
  });

  it("Close is constructor 3 with no fields", () => {
    expect(buildCloseRedeemer()).toMatchObject({ constructor: 3, fields: [] });
  });
});
