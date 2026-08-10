"use client";

import { useState } from "react";
import { useBatcherStore } from "@/stores/useBatcherStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { postCongestion } from "@/hooks/useCongestion";
import { CongestionSparkline } from "./CongestionSparkline";

function label(score: number): { text: string; tone: "success" | "warn" | "danger" } {
  if (score >= 0.7) return { text: "Congested", tone: "danger" };
  if (score >= 0.3) return { text: "Moderate", tone: "warn" };
  return { text: "Quiet", tone: "success" };
}

export function CongestionGauge() {
  const score = useBatcherStore((s) => s.score);
  const [inject, setInject] = useState<number | null>(null);
  const l = label(score);

  return (
    <Card title="Live congestion" right={<Badge tone={l.tone}>{l.text}</Badge>}>
      <div className="flex items-end gap-3">
        <div className="nums text-4xl font-bold text-accent">{score.toFixed(2)}</div>
        <div className="mb-1 text-xs text-muted">
          bigger score → longer batch window → bigger batches
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface2">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.round(score * 100)}%` }}
        />
      </div>

      <CongestionSparkline />

      {/* Real reading comes from Blockfrost block fullness. Preprod is idle, so inject a value to
          demonstrate the adaptive policy. Clear (×) to follow the real signal. */}
      <div className="mt-3">
        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="whitespace-nowrap">Inject congestion</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={inject ?? 0}
            onChange={(e) => {
              const v = Number(e.target.value);
              setInject(v);
              postCongestion({ override: v });
            }}
            className="flex-1 accent-accent"
          />
          <span className="nums w-8 text-right">{(inject ?? 0).toFixed(2)}</span>
          <button
            onClick={() => {
              setInject(null);
              postCongestion({ override: null });
            }}
            className="rounded px-1.5 text-muted hover:text-text"
            title="Follow the real Blockfrost reading"
          >
            ×
          </button>
        </label>
        <p className="mt-1 text-[11px] text-muted opacity-70">
          {inject === null
            ? "following the live Blockfrost reading (idle testnet ≈ 0)"
            : "injected — demonstrating the adaptive policy"}
        </p>
      </div>
    </Card>
  );
}
