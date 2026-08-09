"use client";

import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/types/execution";
import { Loader2, CheckCircle2, XCircle, Clock, Brain, Search, Code2, Eye } from "lucide-react";

const statusConfig: Record<AgentStatus, { label: string; icon: React.ElementType; color: string }> = {
  idle: { label: "Idle", icon: Clock, color: "text-foreground-muted" },
  waiting: { label: "Waiting", icon: Clock, color: "text-warning" },
  planning: { label: "Planning", icon: Brain, color: "text-primary" },
  researching: { label: "Researching", icon: Search, color: "text-secondary" },
  working: { label: "Working", icon: Code2, color: "text-primary" },
  reviewing: { label: "Reviewing", icon: Eye, color: "text-warning" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-success" },
  failed: { label: "Failed", icon: XCircle, color: "text-error" },
};

interface AgentStatusBadgeProps {
  status: AgentStatus;
  className?: string;
}

export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", config.color, className)}>
      {status === "working" || status === "researching" || status === "planning" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      {config.label}
    </span>
  );
}
