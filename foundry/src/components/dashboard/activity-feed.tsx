"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Bell, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExecutionStore } from "@/store/execution-store";

const phaseMeta: Record<string, { label: string; color: string }> = {
  research: { label: "Research Agent completed analysis", color: "#0033ad" },
  architecture: { label: "Architecture Agent designed system", color: "#1a4fc3" },
  contracts: { label: "Contract Engineer developed contracts", color: "#f59e0b" },
  frontend: { label: "Frontend Engineer scaffolded UI", color: "#10b981" },
  security: { label: "Security Engineer completed audit", color: "#ef4444" },
  testing: { label: "QA Engineer finished testing", color: "#3b82f6" },
  documentation: { label: "Documentation Engineer wrote docs", color: "#0033ad" },
  deployment: { label: "Deployment Engineer prepared release", color: "#0033ad" },
};

function ActivityItem({
  text,
  time,
  color,
  isLatest,
  index,
}: {
  text: string;
  time: string;
  color: string;
  isLatest: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex items-start gap-3 px-6 py-3 transition-colors hover:bg-surface-hover"
    >
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300",
            isLatest ? "border-[color] scale-110" : "border-border",
          )}
          style={{ borderColor: isLatest ? color : undefined }}
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isLatest && "animate-pulse",
            )}
            style={{ background: color, boxShadow: isLatest ? `0 0 8px ${color}` : undefined }}
          />
        </div>
        {/* Connector line */}
        <div className="mt-1 h-full w-px bg-surface-hover" />
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm text-foreground">{text}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-foreground-dim" />
          <p className="text-xs text-foreground-dim">{time}</p>
        </div>
      </div>
      {isLatest && (
        <div className="flex h-7 items-center">
          <span className="rounded-md bg-primary-muted px-2 py-0.5 text-[10px] font-medium text-primary">
            Live
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function ActivityFeed() {
  const ref = useRef<HTMLDivElement>(null);
  const execution = useExecutionStore();
  const currentPhase = execution.phase;
  const totalCost = execution.totalCost;

  const activities: Array<{ text: string; time: string; color: string }> = [];

  if (currentPhase !== "research" && execution.startedAt) {
    activities.push({
      text: "CEO Agent started project execution",
      time: formatTimeAgo(execution.startedAt),
      color: "#0033ad",
    });
  }

  if (currentPhase !== "research" && currentPhase !== "completed") {
    const phaseKeys = Object.keys(phaseMeta);
    const phaseIndex = phaseKeys.indexOf(currentPhase);
    for (let i = 0; i < phaseIndex; i++) {
      const phase = phaseKeys[i];
      activities.push({
        text: phaseMeta[phase].label,
        time: "completed",
        color: phaseMeta[phase].color,
      });
    }
    activities.push({
      text: phaseMeta[currentPhase]?.label || `${currentPhase} in progress`,
      time: "in progress",
      color: phaseMeta[currentPhase]?.color || "#0033ad",
    });
  }

  if (execution.status === "completed") {
    activities.push({
      text: `Execution completed — ${totalCost.toFixed(2)} ADA spent`,
      time: "just now",
      color: "#10b981",
    });
  }

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-muted">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Activity Feed</h3>
          <p className="text-xs text-foreground-muted">
            {currentPhase !== "research" ? "Execution in progress" : "Awaiting activity"}
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Zap className="mb-3 h-8 w-8 text-foreground-dim" />
          <p className="text-sm text-foreground-muted">
            No recent activity
          </p>
          <p className="mt-1 text-xs text-foreground-dim">
            Start an execution to see events here
          </p>
        </div>
      ) : (
        <div>
          {activities.map((activity, i) => (
            <ActivityItem
              key={i}
              {...activity}
              isLatest={i === activities.length - 1}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const mins = Math.floor((Date.now() - timestamp) / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}
