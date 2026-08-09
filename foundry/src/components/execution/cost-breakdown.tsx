"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AGENTS, AGENT_CONFIGS } from "@/config/agents";
import { TREASURY_FEE_PERCENTAGE } from "@/lib/constants";
import { Info } from "lucide-react";

interface CostBreakdownProps {
  selectedAgents?: string[];
  walletBalance?: string | null;
  onFund?: () => void;
  funding?: boolean;
}

function lovelaceToAda(lovelace: number | string): string {
  return (Number(lovelace) / 1_000_000).toFixed(2);
}

export function CostBreakdown({
  selectedAgents,
  walletBalance,
}: CostBreakdownProps) {
  const breakdown = useMemo(() => {
    const roles = selectedAgents?.length ? selectedAgents : AGENTS.map((a) => a.role);
    const agents = [
      ...AGENT_CONFIGS.filter((a) => a.role === "ceo"),
      ...AGENTS.filter((a) => roles.includes(a.role)),
    ];

    const items = agents.map((a) => ({
      name: a.name,
      role: a.role,
      feeAda: a.fee / 1_000_000,
      feeLovelace: a.fee,
    }));

    const subtotalLovelace = items.reduce((s, i) => s + i.feeLovelace, 0);
    const treasuryFeeLovelace = Math.round(subtotalLovelace * TREASURY_FEE_PERCENTAGE);
    const totalLovelace = subtotalLovelace + treasuryFeeLovelace;

    return {
      items,
      subtotalLovelace,
      subtotalAda: subtotalLovelace / 1_000_000,
      treasuryFeeLovelace,
      treasuryFeeAda: treasuryFeeLovelace / 1_000_000,
      totalLovelace,
      totalAda: totalLovelace / 1_000_000,
      agentCount: items.length,
    };
  }, [selectedAgents]);

  const balanceNum = walletBalance ? Number(walletBalance) : null;
  const insufficient = balanceNum !== null && balanceNum < breakdown.totalLovelace;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
          <span className="text-xs font-bold text-amber-400">₳</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">Estimated Cost</h3>
      </div>

      <div className="space-y-1.5 mb-3">
        {breakdown.items.map((item) => (
          <div
            key={item.role}
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm"
          >
            <span className="text-foreground-muted">{item.name}</span>
            <span className="font-medium text-foreground">{item.feeAda.toFixed(2)} ₳</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3 space-y-1.5">
        <div className="flex items-center justify-between px-2.5 text-sm">
          <span className="text-foreground-dim">Agent Fees ({breakdown.agentCount})</span>
          <span className="text-foreground-muted">{breakdown.subtotalAda.toFixed(2)} ₳</span>
        </div>
        <div className="flex items-center justify-between px-2.5 text-sm">
          <span className="flex items-center gap-1 text-foreground-dim">
            Treasury Fee ({Math.round(TREASURY_FEE_PERCENTAGE * 100)}%)
            <Info className="h-3 w-3 text-foreground-dim" />
          </span>
          <span className="text-foreground-muted">{breakdown.treasuryFeeAda.toFixed(2)} ₳</span>
        </div>
        <div className="flex items-center justify-between px-2.5 pt-1.5 border-t border-border">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span className="text-base font-bold text-foreground">{breakdown.totalAda.toFixed(2)} ₳</span>
        </div>
      </div>

      {balanceNum !== null && (
        <div
          className={cn(
            "mt-3 rounded-xl px-3 py-2 text-xs flex items-center justify-between",
            insufficient
              ? "bg-red-500/10 text-red-400"
              : "bg-success/10 text-success",
          )}
        >
          <span>Wallet Balance</span>
          <span className="font-semibold">
            {lovelaceToAda(balanceNum)} ₳
            {insufficient && (
              <span className="ml-1.5 text-red-400">Insufficient</span>
            )}
          </span>
        </div>
      )}

      <p className="mt-2 text-xs text-foreground-dim px-2.5">
        Funds will be locked for the duration of execution. Unused funds are returned.
      </p>
    </motion.div>
  );
}
