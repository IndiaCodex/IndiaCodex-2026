/**
 * Tracks tickets that were just submitted for spending but whose tx hasn't confirmed yet, so the
 * ticket list (and the next batch) don't re-pick them during the ~20-40s confirmation window.
 * Server-side, in-memory, with a TTL. Shared across API routes via globalThis.
 */

const TTL_MS = 90_000;

const g = globalThis as unknown as { __pendingSpent?: Map<string, number> };
function store(): Map<string, number> {
  if (!g.__pendingSpent) g.__pendingSpent = new Map();
  return g.__pendingSpent;
}

export function markSpent(refs: string[]): void {
  const m = store();
  const expiry = Date.now() + TTL_MS;
  for (const r of refs) m.set(r, expiry);
}

export function isPendingSpent(ref: string): boolean {
  const m = store();
  const exp = m.get(ref);
  if (exp == null) return false;
  if (Date.now() > exp) {
    m.delete(ref);
    return false;
  }
  return true;
}
