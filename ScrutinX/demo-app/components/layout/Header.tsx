"use client";

import { useBatcherStore } from "@/stores/useBatcherStore";
import { Badge } from "@/components/ui/Badge";

export function Header() {
  const tickets = useBatcherStore((s) => s.tickets.length);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <h1 className="text-xl font-bold">Adaptive Concurrency-Aware Batcher</h1>
        <p className="text-xs text-muted">
          Cardano Preprod · real on-chain settlement · eUTXO contention → adaptive batching → one tx
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone="accent">● Preprod live</Badge>
        <Badge tone="success">{tickets} open tickets</Badge>
      </div>
    </header>
  );
}
