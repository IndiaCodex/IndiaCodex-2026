import { describe, expect, it } from "vitest";
import {
  calculateCreditLine,
  getTierConfig,
  GOLD_CREDIT_LINE_CAP_USD,
  TIERS,
} from "@/lib/mockConstants";

describe("mockConstants economics", () => {
  it("defines Bronze/Silver/Gold LTV tiers matching the design spec", () => {
    expect(getTierConfig("bronze").ltvBps).toBe(5000);
    expect(getTierConfig("silver").ltvBps).toBe(6500);
    expect(getTierConfig("gold").ltvBps).toBe(8000);
    expect(TIERS).toHaveLength(3);
  });

  it("caps the Gold credit line at 25 tUSDM even for large repaid volume", () => {
    expect(calculateCreditLine(10_000)).toBe(GOLD_CREDIT_LINE_CAP_USD);
  });

  it("computes the Gold credit line as 10% of cumulative repaid below the cap", () => {
    expect(calculateCreditLine(100)).toBe(10);
    expect(calculateCreditLine(200)).toBe(20);
  });

  it("throws for an unknown tier id", () => {
    // @ts-expect-error — intentionally passing an invalid tier to test the guard
    expect(() => getTierConfig("platinum")).toThrow(/Unknown reputation tier/);
  });
});
