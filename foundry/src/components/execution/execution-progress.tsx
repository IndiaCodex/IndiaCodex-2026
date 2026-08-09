"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface ExecutionProgressProps {
  phases: Array<{
    id: string;
    label: string;
    status: "pending" | "active" | "completed";
  }>;
  className?: string;
}

export function ExecutionProgress({ phases, className }: ExecutionProgressProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {phases.map((phase, i) => (
        <div key={phase.id} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            {phase.status === "completed" ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircle2 className="h-4 w-4 text-success" />
              </motion.div>
            ) : phase.status === "active" ? (
              <div className="relative">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <motion.div
                  className="absolute inset-0 rounded-full border border-primary/30"
                  animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            ) : (
              <Circle className="h-4 w-4 text-border" />
            )}
            {i < phases.length - 1 && (
              <div
                className={cn(
                  "mt-1 h-5 w-px",
                  phase.status === "completed" ? "bg-success/30" : "bg-border",
                )}
              />
            )}
          </div>
          <div className="flex-1">
            <p
              className={cn(
                "text-xs transition-all duration-300",
                phase.status === "completed" && "text-success",
                phase.status === "active" && "font-medium text-primary",
                phase.status === "pending" && "text-foreground-dim",
              )}
            >
              {phase.label}
            </p>
          </div>
          {phase.status === "active" && (
            <span className="rounded bg-primary-muted px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Now
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
