"use client";

import { useBatcherStore } from "@/stores/useBatcherStore";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export function CongestionSparkline() {
  const history = useBatcherStore((s) => s.scoreHistory);
  const data = history.map((v, i) => ({ i, v }));

  if (data.length < 2) {
    return <div className="mt-3 h-12" />;
  }

  return (
    <div className="mt-3 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={[0, 1]} hide />
          <Line
            type="monotone"
            dataKey="v"
            stroke="#6ea8fe"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
