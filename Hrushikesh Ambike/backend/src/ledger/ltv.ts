// TypeScript mirror of ouro/onchain/lib/ouro/ltv.ak - kept numerically
// identical to the on-chain source (verified 9/9 passing there) so the UI
// can show real max-borrow numbers and the tx builder can pre-flight
// validate before spending fees on a doomed transaction. The chain is the
// only source of truth for what's actually enforced; this is a preview.
import type { Tier } from "../tx/datums";

const TIER_LTV_BPS: Record<Tier, number> = {
  Bronze: 5000,
  Silver: 6500,
  Gold: 8000,
};

const CREDIT_LINE_CAP_TUSDM = 25_000_000;

export function tierLtvBps(tier: Tier): number {
  return TIER_LTV_BPS[tier];
}

export function creditLine(tier: Tier, cumulativeRepaid: number): number {
  if (tier !== "Gold") return 0;
  const tenPct = Math.floor(cumulativeRepaid / 10);
  return Math.min(tenPct, CREDIT_LINE_CAP_TUSDM);
}

export function maxBorrow(
  collateralUsd: number,
  tier: Tier,
  cumulativeRepaid: number,
): number {
  return (
    Math.floor((collateralUsd * tierLtvBps(tier)) / 10000) +
    creditLine(tier, cumulativeRepaid)
  );
}

export function collateralUsdValue(
  collateralLovelace: number,
  priceMicroUsd: number,
): number {
  return Math.floor((collateralLovelace * priceMicroUsd) / 1_000_000);
}

export function netAfterFee(gross: number, originationFeeBps: number): number {
  return gross - Math.floor((gross * originationFeeBps) / 10000);
}
