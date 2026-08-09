"use client";

import {
  Bar,
  BarChart as RBar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SimpleBarChart({
  data,
  dataKey,
  xKey = "label",
  color = "#8b5cf6",
  height = 260,
  valueFormatter,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBar data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey={xKey} stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#6b7280"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "rgba(17, 24, 39, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            fontSize: 12,
            color: "#fff",
          }}
          formatter={(v) => (valueFormatter ? valueFormatter(Number(v)) : v)}
        />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={36} />
      </RBar>
    </ResponsiveContainer>
  );
}
