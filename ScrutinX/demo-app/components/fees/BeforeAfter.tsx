"use client";

import { useBatcherStore } from "@/stores/useBatcherStore";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { formatAda } from "@/lib/format";

export function BeforeAfter() {
  const results = useBatcherStore((s) => s.results);
  const naiveTxCount = useBatcherStore((s) => s.naiveTxCount);
  const batchedTxCount = useBatcherStore((s) => s.batchedTxCount);

  const naiveFee = results.reduce((a, r) => a + (r.naiveFeeEstimate || 0), 0);
  const batchedFee = results.reduce((a, r) => a + (r.feeLovelace || 0), 0);

  return (
    <Card title="Naive vs batched">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Naive txs" value={naiveTxCount} tone="danger" sub="one per request" />
        <Stat label="Batched txs" value={batchedTxCount} tone="success" sub="settlements" />
        <Stat label="Naive fees" value={formatAda(naiveFee)} tone="danger" />
        <Stat label="Batched fees" value={formatAda(batchedFee)} tone="success" />
      </div>
    </Card>
  );
}
