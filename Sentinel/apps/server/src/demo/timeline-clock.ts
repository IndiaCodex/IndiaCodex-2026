/** Deterministic per-scenario clock, so every demo run produces byte-identical timestamps. */
export function makeClock(baseIso: string): (offsetSeconds: number) => string {
  const base = new Date(baseIso).getTime();
  return (offsetSeconds: number) => new Date(base + offsetSeconds * 1000).toISOString();
}
