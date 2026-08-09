"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn, formatADA } from "@/lib/utils";
import {
  ArrowDown,
  Coins,
  Wallet,
  Building2,
  Users,
  Sparkles,
} from "lucide-react";

interface PaymentStep {
  from: string;
  to: string;
  amount: string;
  status: "pending" | "active" | "completed";
  txHash?: string;
}

interface PaymentFlowProps {
  steps: PaymentStep[];
  totalCost?: number;
  className?: string;
}

function PaymentNode({
  icon: Icon,
  label,
  status,
  amount,
}: {
  icon: React.ElementType;
  label: string;
  status: PaymentStep["status"];
  amount: string;
}) {
  return (
    <motion.div
      layout
      animate={{
        borderColor:
          status === "completed"
            ? "rgba(16, 185, 129, 0.3)"
            : status === "active"
              ? "rgba(99, 102, 241, 0.3)"
              : "rgba(255,255,255,0.1)",
        backgroundColor:
          status === "completed"
            ? "rgba(16, 185, 129, 0.05)"
            : status === "active"
              ? "rgba(99, 102, 241, 0.05)"
              : "rgba(255,255,255,0.03)",
      }}
      className="flex items-center gap-2 rounded-lg border px-3 py-2 flex-1"
    >
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center",
          status === "completed" && "bg-success/20",
          status === "active" && "bg-primary/20",
          status === "pending" && "bg-surface-hover",
        )}
      >
        {status === "completed" ? (
          <Sparkles className="h-4 w-4 text-success" />
        ) : (
          <Icon
            className={cn(
              "h-4 w-4",
              status === "active" ? "text-primary" : "text-foreground-muted",
            )}
          />
        )}
      </div>
      <div className="min-w-0">
        <span className="text-xs font-medium text-foreground block truncate">
          {label}
        </span>
        <span
          className={cn(
            "text-[10px] block",
            status === "completed" && "text-success",
            status === "active" && "text-primary",
            status === "pending" && "text-foreground-muted",
          )}
        >
          {amount}
        </span>
      </div>
    </motion.div>
  );
}

export function PaymentFlow({ steps, totalCost, className }: PaymentFlowProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {totalCost !== undefined && (
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs text-foreground-muted">Total Budget</span>
          <span className="text-sm font-bold text-foreground">
            {formatADA(totalCost)}
          </span>
        </div>
      )}

      {steps.map((step, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-3">
            <PaymentNode
              icon={
                step.from === "User"
                  ? Wallet
                  : step.from === "Treasury"
                    ? Building2
                    : Users
              }
              label={step.from}
              status={step.status}
              amount={step.amount}
            />

            <AnimatePresence mode="wait">
              {step.status === "active" ? (
                <motion.div
                  key="arrow-active"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <ArrowDown className="h-4 w-4 text-primary animate-bounce" />
                </motion.div>
              ) : step.status === "completed" ? (
                <motion.div
                  key="arrow-completed"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <ArrowDown className="h-4 w-4 text-success" />
                </motion.div>
              ) : (
                <motion.div
                  key="arrow-pending"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <ArrowDown className="h-4 w-4 text-foreground-muted opacity-30" />
                </motion.div>
              )}
            </AnimatePresence>

            <PaymentNode
              icon={
                step.to === "CEO"
                  ? Users
                  : step.to === "Treasury"
                    ? Building2
                    : Users
              }
              label={step.to}
              status={step.status}
              amount={step.amount}
            />
          </div>

          {step.txHash && (
            <p className="text-[10px] text-foreground-muted text-center font-mono">
              tx: {step.txHash.slice(0, 16)}...
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
