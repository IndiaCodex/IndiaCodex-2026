"use client";

import { useBatcherStore } from "@/stores/useBatcherStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { shortHash } from "@/lib/format";

export function RequestStream() {
  const queue = useBatcherStore((s) => s.queue);

  return (
    <Card
      title="Incoming claim requests"
      right={<Badge>{queue.length} in rush</Badge>}
      className="h-full"
    >
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {queue.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">
            No claim rush — fire one against the live tickets above.
          </p>
        )}
        {queue.slice(0, 40).map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-md bg-surface2 px-2.5 py-1.5 text-xs"
          >
            <span className="font-mono text-muted">user {r.id.split("-").slice(-1)}</span>
            <span className="font-mono text-[11px] text-text">
              → ticket {shortHash(r.targetUtxoRef, 6, 4)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
