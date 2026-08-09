/**
 * Off-chain mirror of the on-chain bonding-curve math
 * (contracts/lib/launchpad/curve.ak). MUST match bit-for-bit.
 *
 * Fixed protocol constants (same for every token):
 *   price(sold) = BASE_PRICE + (SLOPE_NUM / SLOPE_DEN) * sold   [lovelace]
 *   P0 = 50 lovelace, slope = 5e-7, graduation at 800M sold (≈200,000 ADA).
 * Buy rounds UP, sell rounds DOWN (in the pool's favour).
 */
export const BASE_PRICE = 50n;
export const SLOPE_NUM = 5n;
export const SLOPE_DEN = 10_000_000n;

function slopeIntegral(sold: bigint, amount: bigint): bigint {
  return SLOPE_NUM * (sold * amount + (amount * (amount - 1n)) / 2n);
}

/** Cost in lovelace to buy `amount` tokens starting at `sold` (rounds up). */
export function buyCost(sold: bigint, amount: bigint): bigint {
  return BASE_PRICE * amount + (slopeIntegral(sold, amount) + SLOPE_DEN - 1n) / SLOPE_DEN;
}

/** Refund in lovelace to sell `amount` tokens ending at `sold` (rounds down). */
export function sellRefund(sold: bigint, amount: bigint): bigint {
  return BASE_PRICE * amount + slopeIntegral(sold - amount, amount) / SLOPE_DEN;
}

/** Spot price (lovelace) of the next token at `sold`. */
export function priceAt(sold: bigint): bigint {
  return BASE_PRICE + (SLOPE_NUM * sold) / SLOPE_DEN;
}
