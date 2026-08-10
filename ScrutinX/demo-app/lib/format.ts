/** Display helpers. Keep lovelace in logic; format to ADA only at the UI edge. */

export function lovelaceToAda(lovelace: number): number {
  return lovelace / 1_000_000;
}

export function formatAda(lovelace: number, decimals = 6): string {
  return `₳${lovelaceToAda(lovelace).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  })}`;
}

export function shortHash(hash: string, head = 8, tail = 6): string {
  if (!hash) return "";
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}
