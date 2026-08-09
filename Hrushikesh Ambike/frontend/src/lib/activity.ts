/**
 * Client-side recent-activity log.
 *
 * Every deposit / borrow / collateral-fix the user submits from this browser
 * is recorded to localStorage so the dashboard can show a "recent activity"
 * feed with Cardanoscan links. This is intentionally local-first: it needs
 * no indexer round-trip, works the moment a tx is submitted (before it even
 * confirms), and never shows someone else's transactions.
 */

export type ActivityKind = "deposit" | "borrow" | "repay" | "collateral";

export interface ActivityEntry {
  kind: ActivityKind;
  txHash: string;
  /** Unix ms when the tx was submitted from this browser. */
  at: number;
  /** Human amount label, e.g. "100 ADA" or "2.25 tUSDM". */
  amountLabel: string;
}

const STORAGE_KEY = "ouro.activity.v1";
const MAX_ENTRIES = 20;

/** Dispatched on `window` whenever the log changes, so feeds can re-render. */
export const ACTIVITY_EVENT = "ouro:activity";

const KINDS: readonly ActivityKind[] = [
  "deposit",
  "borrow",
  "repay",
  "collateral",
];

function isActivityEntry(value: unknown): value is ActivityEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.txHash === "string" &&
    typeof entry.at === "number" &&
    typeof entry.amountLabel === "string" &&
    KINDS.includes(entry.kind as ActivityKind)
  );
}

export function loadActivity(): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isActivityEntry);
  } catch {
    // Corrupt storage is not worth surfacing; start fresh.
    return [];
  }
}

export function recordActivity(
  entry: Omit<ActivityEntry, "at"> & { at?: number },
): void {
  if (typeof window === "undefined") return;
  const full: ActivityEntry = { at: Date.now(), ...entry };
  const next = [full, ...loadActivity()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota/private-mode failures degrade to "no history" — acceptable.
  }
  window.dispatchEvent(new CustomEvent(ACTIVITY_EVENT));
}
