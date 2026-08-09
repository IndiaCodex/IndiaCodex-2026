/**
 * Local mirror of Ouro's protocol economics constants.
 *
 * These values are copied from `ouro/offchain/src/config.ts` (the source of
 * truth) so the demo UI's placeholder numbers stay representative of the
 * real protocol ahead of live contract wiring. `web/` does not import from
 * `offchain/` directly at this stage (see Task 4.1 scope) — if the source
 * values change, update both places.
 *
 * ALL VALUES BELOW ARE MOCK / DISPLAY-ONLY until the tx-builders (deposit,
 * borrow, repay, harvest) from Phase 2/3 are wired into this app.
 */

export type ReputationTier = "bronze" | "silver" | "gold";

export interface TierConfig {
  readonly id: ReputationTier;
  readonly label: string;
  readonly ltvBps: number;
  readonly minLoansRepaid: number;
  readonly minCumulativeRepaidUsd: number;
  readonly hasCreditLine: boolean;
}

/** Origination fee taken at draw, in basis points. 100 bps = 1%. */
export const ORIGINATION_FEE_BPS = 100;

/** Share of each yield harvest the protocol keeps as revenue, in basis points. */
export const YIELD_SPREAD_PROTOCOL_BPS = 1500;

/** Share of each yield harvest that reduces borrower debt, in basis points. */
export const YIELD_SPREAD_SELF_REPAY_BPS = 10_000 - YIELD_SPREAD_PROTOCOL_BPS;

/** Refundable stake registration deposit per vault, in lovelace. */
export const STAKE_REGISTRATION_DEPOSIT_LOVELACE = 2_000_000;

/** LTV tiers, keyed by reputation tier. Thresholds are cumulative/lifetime. */
export const TIERS: readonly TierConfig[] = [
  {
    id: "bronze",
    label: "Bronze",
    ltvBps: 5000,
    minLoansRepaid: 0,
    minCumulativeRepaidUsd: 0,
    hasCreditLine: false,
  },
  {
    id: "silver",
    label: "Silver",
    ltvBps: 6500,
    minLoansRepaid: 2,
    minCumulativeRepaidUsd: 500,
    hasCreditLine: false,
  },
  {
    id: "gold",
    label: "Gold",
    ltvBps: 8000,
    minLoansRepaid: 5,
    minCumulativeRepaidUsd: 2000,
    hasCreditLine: true,
  },
];

/** Gold credit-line cap, in tUSDM (uncollateralized ceiling). */
export const GOLD_CREDIT_LINE_CAP_USD = 25;

/** Gold credit line = min(cap, 10% x cumulative_repaid). */
export const GOLD_CREDIT_LINE_REPAID_BPS = 1000;

/** tUSDM asset naming, mirrored from the reserve config (hex of "tUSDM"). */
export const T_USDM_ASSET_NAME_HEX = "745553444d";

export function getTierConfig(tier: ReputationTier): TierConfig {
  const config = TIERS.find((candidate) => candidate.id === tier);
  if (!config) {
    throw new Error(`Unknown reputation tier: ${tier}`);
  }
  return config;
}

/** Mirrors the on-chain Gold credit-line formula: min(cap, 10% x repaid). */
export function calculateCreditLine(cumulativeRepaidUsd: number): number {
  const repaidShare = (cumulativeRepaidUsd * GOLD_CREDIT_LINE_REPAID_BPS) / 10_000;
  return Math.min(GOLD_CREDIT_LINE_CAP_USD, repaidShare);
}

/**
 * Placeholder demo position — NOT live chain data. Task 4.3 replaces this
 * with a polled vault UTxO datum read.
 */
export const MOCK_POSITION = {
  collateralAda: 1000,
  adaUsdPrice: 0.4,
  originalDebtUsdm: 198, // 400 * 50% LTV, minus 1% origination fee
  currentDebtUsdm: 141.6,
  tier: "silver" as ReputationTier,
  cumulativeRepaidUsdm: 640,
  loansRepaid: 3,
  epochsToProjectedPayoff: 47,
};
