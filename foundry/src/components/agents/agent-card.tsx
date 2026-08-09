"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AgentInstance } from "@/types/agent";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Clock, Coins, BrainCircuit } from "lucide-react";
import { formatDuration } from "@/lib/utils";

const statusColors: Record<string, string> = {
  idle: "text-foreground-muted border-foreground-muted/20",
  waiting: "text-warning border-warning/20 bg-warning/10",
  planning: "text-primary border-primary/20 bg-primary/10",
  researching: "text-secondary border-secondary/20 bg-secondary/10",
  working: "text-primary border-primary/20 bg-primary/10",
  reviewing: "text-warning border-warning/20 bg-warning/10",
  completed: "text-success border-success/20 bg-success/10",
  failed: "text-error border-error/20 bg-error/10",
};

interface AgentCardProps {
  agent: AgentInstance;
  compact?: boolean;
}

export function AgentCard({ agent, compact }: AgentCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-3",
        "transition-all duration-300",
        agent.status === "working" && "border-primary/30 shadow-lg shadow-primary/10",
        agent.status === "completed" && "border-success/30",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar size={compact ? "sm" : "md"} fallback={agent.config.name[0]}>
          {agent.config.avatar && <img src={agent.config.avatar} alt={agent.config.name} />}
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{agent.config.name}</p>
          <p className="text-xs text-foreground-muted capitalize">{agent.config.role.replace("-", " ")}</p>
        </div>
        <Badge variant="outline" className={cn("capitalize", statusColors[agent.status])}>
          {agent.status}
        </Badge>
      </div>

      {!compact && (
        <>
          {agent.currentTask && (
            <p className="text-xs text-foreground-muted truncate">
              Task: {agent.currentTask}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(agent.duration)}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {agent.cost.toLocaleString()} ₳
            </span>
            <span className="flex items-center gap-1">
              <BrainCircuit className="h-3 w-3" />
              {Math.round(agent.confidence * 100)}%
            </span>
          </div>

          <Progress
            value={agent.confidence * 100}
            size="sm"
            indicatorClassName={cn(
              agent.status === "completed" && "bg-success",
              agent.status === "failed" && "bg-error",
            )}
          />
        </>
      )}
    </motion.div>
  );
}
