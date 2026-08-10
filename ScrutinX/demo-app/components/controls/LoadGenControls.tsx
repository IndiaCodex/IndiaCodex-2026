"use client";

import { useBatcherStore } from "@/stores/useBatcherStore";
import { useBatcher } from "@/hooks/useBatcher";
import { Button } from "@/components/ui/Button";

export function LoadGenControls() {
  const { loadTickets, fireRush, settle } = useBatcher();
  const settling = useBatcherStore((s) => s.settling);
  const ticketsLoading = useBatcherStore((s) => s.ticketsLoading);
  const tickets = useBatcherStore((s) => s.tickets.length);
  const chosen = useBatcherStore((s) => s.currentBatch?.requests.length ?? 0);
  const error = useBatcherStore((s) => s.lastError);
  const reset = useBatcherStore((s) => s.reset);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={loadTickets} disabled={ticketsLoading}>
          {ticketsLoading ? "Loading…" : "↻ Refresh tickets"}
        </Button>
        <span className="mr-1 text-xs text-muted">Claim rush (24 users):</span>
        <Button tone="accent" onClick={() => fireRush("heavy")} disabled={settling || !tickets}>
          Heavy contention
        </Button>
        <Button onClick={() => fireRush("spread")} disabled={settling || !tickets}>
          Spread
        </Button>
        <Button onClick={() => fireRush("mixed")} disabled={settling || !tickets}>
          Mixed
        </Button>
        <Button tone="accent" onClick={settle} disabled={settling || chosen === 0}>
          {settling ? "Settling on-chain…" : `⚡ Settle ${chosen} in 1 tx`}
        </Button>
        <Button tone="danger" onClick={reset}>
          Reset
        </Button>
      </div>
      {error && (
        <div className="rounded-md border border-danger/40 bg-surface px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}
      {settling && (
        <div className="rounded-md border border-accent/40 bg-surface px-3 py-2 text-xs text-accent">
          Building, signing and submitting the batch to Cardano Preprod… (~20–40s to confirm)
        </div>
      )}
    </div>
  );
}
