"use client";

import { motion } from "framer-motion";
import {
  Users,
  FileText,
  FileCode2,
  Wallet,
  Wrench,
  Coins as TokensIcon,
  Timer,
  BrainCircuit,
} from "lucide-react";
import { formatDuration, formatTokens } from "@/lib/utils";
import type { CompanySummary } from "@/types/company";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] p-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-foreground-muted">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}

interface ScoreIndicatorProps {
  label: string;
  score: number;
  delay?: number;
}

function ScoreIndicator({ label, score, delay = 0 }: ScoreIndicatorProps) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] p-6"
    >
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#0033ad"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ delay: delay + 0.3, duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{score}%</span>
        </div>
      </div>
      <span className="text-sm font-medium text-foreground-muted text-center">
        {label}
      </span>
    </motion.div>
  );
}

interface CompanySummaryProps {
  summary: CompanySummary;
}

export function CompanySummary({ summary }: CompanySummaryProps) {
  const stats = [
    { icon: Users, label: "Agents Hired", value: String(summary.agentsHired) },
    { icon: FileText, label: "Files Generated", value: String(summary.filesGenerated) },
    { icon: FileCode2, label: "Contracts Created", value: String(summary.contractsCreated) },
    { icon: Wallet, label: "Wallets Used", value: String(summary.walletsUsed) },
    { icon: Wrench, label: "Tool Calls", value: String(summary.toolCalls) },
    { icon: TokensIcon, label: "Tokens Consumed", value: formatTokens(summary.tokensConsumed) },
    { icon: Timer, label: "Execution Time", value: formatDuration(summary.executionTime) },
    { icon: BrainCircuit, label: "Hours Saved", value: `~${summary.engineeringHoursSaved}h` },
  ];

  const scores = [
    { label: "Deployment Readiness", score: summary.deploymentReadinessScore },
    { label: "Project Health", score: summary.projectHealthScore },
    { label: "Catalyst Readiness", score: summary.catalystReadinessScore },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 0.04} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {scores.map((score, i) => (
          <ScoreIndicator key={score.label} {...score} delay={i * 0.1} />
        ))}
      </div>
    </div>
  );
}
