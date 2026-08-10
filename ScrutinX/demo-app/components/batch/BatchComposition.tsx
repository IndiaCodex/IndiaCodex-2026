"use client";

import { useBatcherStore } from "@/stores/useBatcherStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function BatchComposition() {
  const batch = useBatcherStore((s) => s.currentBatch);
  const deferred = useBatcherStore((s) => s.queue.length);
  const chosen = batch?.requests ?? [];

  return (
    <Card
      title="Current batch"
      right={
        <div className="flex gap-2">
          <Badge tone="success">{chosen.length} settling</Badge>
          <Badge>{deferred} deferred</Badge>
        </div>
      }
    >
      {chosen.length === 0 ? (
        <p className="py-3 text-sm text-muted">No batch selected yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {chosen.map((r) => (
            <span
              key={r.id}
              className="rounded-md bg-success/15 px-2 py-1 text-xs font-medium text-success"
            >
              {r.targetUtxoRef.split("#")[0]}
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        Non-conflicting requests are settled together in one tx; conflicting ones wait for the next
        cycle (they take turns).
      </p>
    </Card>
  );
}
