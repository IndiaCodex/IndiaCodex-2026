/** Formatting helpers for terminal-style numeric and address display. */

export function formatUsd(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatTUsdm(value: number): string {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} tUSDM`;
}

export function formatAda(value: number): string {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} ADA`;
}

const LOVELACE_PER_ADA = 1_000_000;

/** Formats a CIP-30 lovelace balance (string) as a human tADA amount. */
export function formatLovelaceAsTAda(lovelace: string): string {
  const ada = Number(lovelace) / LOVELACE_PER_ADA;
  if (!Number.isFinite(ada)) {
    return "— tADA";
  }
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(ada)} tADA`;
}

export function formatPercent(bps: number): string {
  return `${(bps / 100).toFixed(0)}%`;
}

export function truncateAddress(address: string, visible = 6): string {
  if (address.length <= visible * 2 + 3) {
    return address;
  }
  return `${address.slice(0, visible)}…${address.slice(-visible)}`;
}
