import { describe, expect, it } from "vitest";
import {
  buildPayoffProjection,
  epochsToPayoff,
  projectedPayoffDate,
  selfRepayPerEpochMicro,
} from "@/lib/selfRepay";

describe("selfRepayPerEpochMicro", () => {
  it("computes the per-epoch buy-down for a 1000 ADA vault at $0.40", () => {
    // 1000 ADA * 3% APY / 73 epochs = ~0.411 ADA/epoch of staking yield.
    // At $0.40 that's ~$0.1644; 85% of it (self-repay share) = ~$0.1397.
    const perEpoch = selfRepayPerEpochMicro(1_000_000_000, 400_000);
    expect(perEpoch).toBeGreaterThan(139_000);
    expect(perEpoch).toBeLessThan(140_000);
  });

  it("returns 0 without collateral or without a price", () => {
    expect(selfRepayPerEpochMicro(0, 400_000)).toBe(0);
    expect(selfRepayPerEpochMicro(1_000_000_000, 0)).toBe(0);
  });
});

describe("epochsToPayoff", () => {
  it("rounds partial epochs up", () => {
    expect(epochsToPayoff(10, 3)).toBe(4);
  });

  it("is 0 for zero debt and Infinity for zero yield", () => {
    expect(epochsToPayoff(0, 100)).toBe(0);
    expect(epochsToPayoff(100, 0)).toBe(Infinity);
  });
});

describe("projectedPayoffDate", () => {
  it("adds 5 days per epoch", () => {
    const from = new Date("2026-07-02T00:00:00Z");
    const payoff = projectedPayoffDate(10, from);
    expect(payoff.toISOString()).toBe("2026-08-21T00:00:00.000Z");
  });
});

describe("buildPayoffProjection", () => {
  it("starts at the full debt and ends at zero", () => {
    const points = buildPayoffProjection(1_000_000, 100_000);
    expect(points[0]).toEqual({ epoch: 0, debtMicro: 1_000_000 });
    expect(points.at(-1)).toEqual({ epoch: 10, debtMicro: 0 });
  });

  it("downsamples long horizons to at most maxPoints", () => {
    const points = buildPayoffProjection(1_000_000_000, 1_000, 24);
    expect(points.length).toBeLessThanOrEqual(24);
    expect(points[0]?.epoch).toBe(0);
    expect(points.at(-1)?.debtMicro).toBe(0);
  });

  it("is empty when there is no debt or no yield", () => {
    expect(buildPayoffProjection(0, 100)).toEqual([]);
    expect(buildPayoffProjection(100, 0)).toEqual([]);
  });
});
