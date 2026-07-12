"use client";

import { useBatcherStore } from "@/stores/useBatcherStore";
import { Card } from "@/components/ui/Card";
import { formatAda } from "@/lib/format";

export function FeesSavedCounter() {
  const saved = useBatcherStore((s) => s.totalSavedLovelace);

  return (
    <Card title="Fees saved (this session)">
      <div className="nums text-4xl font-bold text-success">{formatAda(saved)}</div>
      <p className="mt-1 text-xs text-muted">
        vs submitting every request as its own transaction. The flat per-tx fee (
        <span className="font-mono">minFeeB ≈ ₳0.155</span>) is paid once per batch, not once per user.
      </p>
    </Card>
  );
}
