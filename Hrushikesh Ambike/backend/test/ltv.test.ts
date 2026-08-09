import { describe, expect, it } from "vitest";
import { collateralUsdValue, creditLine, maxBorrow, netAfterFee } from "../src/ledger/ltv";

// Same numbers as ouro/onchain/lib/ouro/ltv.ak's tests - this file must
// stay numerically identical to that verified source.
describe("maxBorrow (mirrors onchain ltv.ak)", () => {
  it("bronze is 50pct", () => {
    expect(maxBorrow(400_000_000, "Bronze", 0)).toBe(200_000_000);
  });

  it("silver is 65pct", () => {
    expect(maxBorrow(400_000_000, "Silver", 600_000_000)).toBe(260_000_000);
  });

  it("gold adds capped credit line", () => {
    expect(maxBorrow(400_000_000, "Gold", 2_000_000_000)).toBe(345_000_000);
  });
});

describe("creditLine", () => {
  it("caps at 25 tUSDM", () => {
    expect(creditLine("Gold", 10_000_000_000)).toBe(25_000_000);
  });

  it("is zero for non-Gold tiers", () => {
    expect(creditLine("Silver", 5_000_000_000)).toBe(0);
  });
});

describe("collateralUsdValue", () => {
  it("matches the vault.ak stub-price worked example", () => {
    // 1000 ADA @ $0.40/ADA = $400
    expect(collateralUsdValue(1_000_000_000, 400_000)).toBe(400_000_000);
  });
});

describe("netAfterFee", () => {
  it("deducts a 1% origination fee", () => {
    expect(netAfterFee(200_000_000, 100)).toBe(198_000_000);
  });
});
