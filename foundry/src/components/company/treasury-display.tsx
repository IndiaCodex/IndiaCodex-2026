"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { cn, formatADA } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Treasury, Transaction } from "@/types/company";

const typeConfig: Record<string, { variant: "default" | "secondary" | "success" | "warning" | "error" | "outline"; label: string }> = {
  payment: { variant: "default", label: "Payment" },
  fee: { variant: "warning", label: "Fee" },
  reward: { variant: "success", label: "Reward" },
};

const statusConfig: Record<string, { variant: "warning" | "success" | "error"; label: string; icon: React.ElementType }> = {
  pending: { variant: "warning", label: "Pending", icon: Clock },
  confirmed: { variant: "success", label: "Confirmed", icon: CheckCircle2 },
  failed: { variant: "error", label: "Failed", icon: XCircle },
};

function TransactionRow({ tx, index }: { tx: Transaction; index: number }) {
  const typeCfg = typeConfig[tx.type] ?? typeConfig.payment;
  const statusCfg = statusConfig[tx.status] ?? statusConfig.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-hover"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {tx.amount >= 0 ? (
          <TrendingUp className="h-4 w-4 text-green-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-foreground-muted truncate">{tx.from}</span>
          <ArrowRight className="h-3 w-3 shrink-0 text-foreground-muted" />
          <span className="text-xs text-foreground-muted truncate">{tx.to}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={typeCfg.variant} className="text-[10px] px-1.5 py-0">
            {typeCfg.label}
          </Badge>
          <span className="text-[10px] text-foreground-muted">
            {new Date(tx.timestamp).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          "text-sm font-semibold tabular-nums",
          tx.amount >= 0 ? "text-green-400" : "text-red-400",
        )}>
          {tx.amount >= 0 ? "+" : ""}{formatADA(tx.amount)}
        </span>
        <StatusIcon className={cn(
          "h-4 w-4",
          statusCfg.variant === "success" && "text-green-400",
          statusCfg.variant === "warning" && "text-yellow-400",
          statusCfg.variant === "error" && "text-red-400",
        )} />
      </div>
    </motion.div>
  );
}

interface TreasuryDisplayProps {
  treasury: Treasury;
}

export function TreasuryDisplay({ treasury }: TreasuryDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.3 }}
          className="rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] p-5"
        >
          <div className="flex items-center gap-2 text-foreground-muted mb-2">
            <Wallet className="h-4 w-4" />
            <span className="text-xs">Total Balance</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatADA(treasury.balance)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] p-5"
        >
          <div className="flex items-center gap-2 text-foreground-muted mb-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-xs">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-red-400">
            {formatADA(treasury.totalSpent)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] p-5"
        >
          <div className="flex items-center gap-2 text-foreground-muted mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {formatADA(treasury.totalEarned)}
          </p>
        </motion.div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">
          Recent Transactions
        </h4>
        <div className="space-y-1">
          {treasury.transactions.length === 0 ? (
            <p className="text-sm text-foreground-muted text-center py-8">
              No transactions yet
            </p>
          ) : (
            treasury.transactions.map((tx, i) => (
              <TransactionRow key={tx.id} tx={tx} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
