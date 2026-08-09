export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatRelativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const deltaSeconds = Math.round(deltaMs / 1000);
  const units: readonly [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(deltaSeconds) >= secondsInUnit) {
      return formatter.format(Math.round(-deltaSeconds / secondsInUnit), unit);
    }
  }
  return formatter.format(-deltaSeconds, "second");
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function truncateHash(hash: string, length = 10): string {
  return `${hash.slice(0, length)}…`;
}

/**
 * Head+tail truncation, not head-only: Sentinel's own identity fields
 * are frequently prefix-sharing by construction (UUIDv7 execution IDs
 * are time-ordered, so a batch of nearby executions share a long common
 * prefix — the demo scenarios are the sharpest example). A head-only
 * truncation collapses exactly those IDs to an identical-looking
 * string; keeping a tail preserves the part most likely to differ.
 */
export function truncateId(id: string, headLength = 8, tailLength = 6): string {
  if (id.length <= headLength + tailLength + 1) return id;
  return `${id.slice(0, headLength)}…${id.slice(-tailLength)}`;
}
