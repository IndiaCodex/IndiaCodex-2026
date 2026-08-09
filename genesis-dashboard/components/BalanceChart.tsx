'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface BalanceSnapshot {
  balance: number;
  timestamp: number;
}

interface BalanceChartProps {
  balanceHistory: BalanceSnapshot[];
  currentBalance: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl text-xs">
        <p className="text-zinc-400 mb-1">{label}</p>
        <p className="text-emerald-400 font-bold font-mono">
          {payload[0].value?.toFixed(2)} ADA
        </p>
      </div>
    );
  }
  return null;
};

export function BalanceChart({ balanceHistory, currentBalance }: BalanceChartProps) {
  if (!balanceHistory || balanceHistory.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
        Not enough data yet — run more ticks to see the balance curve.
      </div>
    );
  }

  const data = balanceHistory.map((snap, i) => ({
    tick: `T${i}`,
    balance: Math.round(snap.balance * 100) / 100,
    time: new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const min = Math.min(...data.map(d => d.balance));
  const max = Math.max(...data.map(d => d.balance));
  const trend = data[data.length - 1].balance - data[0].balance;

  return (
    <div>
      {/* Mini stat row */}
      <div className="flex gap-4 mb-4 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-zinc-500 uppercase tracking-wider">Current</span>
          <span className="text-white font-bold font-mono">{currentBalance.toFixed(2)} ADA</span>
        </div>
        <div className="w-px bg-zinc-800" />
        <div className="flex flex-col gap-0.5">
          <span className="text-zinc-500 uppercase tracking-wider">Peak</span>
          <span className="text-emerald-400 font-bold font-mono">{max.toFixed(2)} ADA</span>
        </div>
        <div className="w-px bg-zinc-800" />
        <div className="flex flex-col gap-0.5">
          <span className="text-zinc-500 uppercase tracking-wider">Low</span>
          <span className="text-amber-400 font-bold font-mono">{min.toFixed(2)} ADA</span>
        </div>
        <div className="w-px bg-zinc-800" />
        <div className="flex flex-col gap-0.5">
          <span className="text-zinc-500 uppercase tracking-wider">Net</span>
          <span className={`font-bold font-mono ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(2)} ADA
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="tick"
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[Math.max(0, min - 2), max + 2]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#balanceGradient)"
            dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
