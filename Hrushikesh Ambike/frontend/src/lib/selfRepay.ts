/**
 * Self-repay projection math.
 *
 * Ouro's core mechanic: the vault's tADA keeps staking, and 85% of each
 * epoch's staking reward (see YIELD_SPREAD_SELF_REPAY_BPS in
 * offchain/src/config.ts) is harvested to buy the borrower's tUSDM debt
 * down. These helpers project that melt curve from live vault numbers so
 * the UI can show *when* a debt reaches zero, not just that it will.
 *
 * All monetary inputs/outputs are micro units (1 tUSDM = 1_000_000 micro,
 * pegged 1:1 to USD) to match the on-chain datum and the /api routes.
 */

/** Representative Cardano staking yield, in basis points (~3% APY). */
export const STAKING_APY_BPS = 300;

/** Cardano epochs are 5 days; 365 / 5 = 73 per year. */
export const EPOCHS_PER_YEAR = 73;

/** Days per Cardano epoch. */
export const EPOCH_DAYS = 5;

/** Share of each harvest that reduces debt (protocol keeps the rest). */
export const SELF_REPAY_SHARE_BPS = 8_500;

const BPS_DENOMINATOR = 10_000;
const LOVELACE_PER_ADA = 1_000_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ProjectionPoint {
  /** Epochs from now (0 = today). */
  epoch: number;
  /** Projected remaining debt at this epoch, in micro tUSDM. */
  debtMicro: number;
}

/**
 * Micro tUSDM of debt bought down per epoch for a vault of
 * `collateralLovelace` at the given oracle price.
 */
export function selfRepayPerEpochMicro(
  collateralLovelace: number,
  priceMicroUsd: number,
): number {
  if (collateralLovelace <= 0 || priceMicroUsd <= 0) return 0;
  const collateralAda = collateralLovelace / LOVELACE_PER_ADA;
  const epochYieldAda =
    (collateralAda * STAKING_APY_BPS) / BPS_DENOMINATOR / EPOCHS_PER_YEAR;
  const epochYieldMicroUsd = epochYieldAda * priceMicroUsd;
  return Math.floor(
    (epochYieldMicroUsd * SELF_REPAY_SHARE_BPS) / BPS_DENOMINATOR,
  );
}

/**
 * Whole epochs until the debt reaches zero at the given per-epoch repay
 * rate. `Infinity` when the rate is zero (no collateral or no price).
 */
export function epochsToPayoff(
  debtMicro: number,
  perEpochMicro: number,
): number {
  if (debtMicro <= 0) return 0;
  if (perEpochMicro <= 0) return Infinity;
  return Math.ceil(debtMicro / perEpochMicro);
}

/** Calendar date `epochs` epochs from `from` (defaults to now). */
export function projectedPayoffDate(epochs: number, from = new Date()): Date {
  return new Date(from.getTime() + epochs * EPOCH_DAYS * MS_PER_DAY);
}

/**
 * Debt-over-time curve from now until payoff, downsampled to at most
 * `maxPoints` points (always including epoch 0 and the payoff epoch).
 * Returns an empty array when there is no debt or the debt never pays off.
 */
export function buildPayoffProjection(
  debtMicro: number,
  perEpochMicro: number,
  maxPoints = 24,
): ProjectionPoint[] {
  const totalEpochs = epochsToPayoff(debtMicro, perEpochMicro);
  if (totalEpochs === 0 || !Number.isFinite(totalEpochs)) return [];

  const steps = Math.min(maxPoints - 1, totalEpochs);
  const points: ProjectionPoint[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const epoch = Math.round((totalEpochs * i) / steps);
    points.push({
      epoch,
      debtMicro: Math.max(0, debtMicro - epoch * perEpochMicro),
    });
  }
  return points;
}
