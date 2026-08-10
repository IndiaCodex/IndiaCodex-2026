"use client";

import { CongestionGauge } from "@/components/congestion/CongestionGauge";
import { ContentionGraph } from "@/components/graph/ContentionGraph";
import { BatchComposition } from "@/components/batch/BatchComposition";
import { SettlementLink } from "@/components/fees/SettlementLink";

export function BatcherPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-success">
        Batcher path — after
      </h2>
      <CongestionGauge />
      <ContentionGraph />
      <BatchComposition />
      <SettlementLink />
    </div>
  );
}
