"use client";

import {
  Area,
  AreaChart as RArea,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "rgba(17, 24, 39, 0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
};

export function GradientAreaChart({
  data,
  dataKey,
  xKey = "label",
  color = "#22d3ee",
  height = 260,
  secondKey,
  secondColor = "#8b5cf6",
  valueFormatter,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  secondKey?: string;
  secondColor?: string;
  valueFormatter?: (v: number) => string;
}) {
  const gid = `grad-${dataKey}`;
  const gid2 = `grad-${secondKey ?? "b"}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RArea data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={gid2} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={secondColor} stopOpacity={0.28} />
            <stop offset="100%" stopColor={secondColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey={xKey} stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#6b7280"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => (valueFormatter ? valueFormatter(Number(v)) : v)} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gid})`} />
        {secondKey && (
          <Area
            type="monotone"
            dataKey={secondKey}
            stroke={secondColor}
            strokeWidth={2}
            fill={`url(#${gid2})`}
          />
        )}
      </RArea>
    </ResponsiveContainer>
  );
}
