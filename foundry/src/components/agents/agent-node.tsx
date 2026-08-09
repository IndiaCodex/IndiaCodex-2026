"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/types/execution";
import type { ProjectOutput } from "@/types/project";
import { Loader2, CheckCircle2, XCircle, Clock, Bot, FileText, FileCode2 } from "lucide-react";

const statusConfig: Record<
  AgentStatus,
  { border: string; bg: string; icon: "spinner" | "check" | "x" | "clock" }
> = {
  idle: { border: "border-border", bg: "bg-surface", icon: "clock" },
  waiting: { border: "border-border", bg: "bg-surface", icon: "clock" },
  planning: { border: "border-primary/25", bg: "bg-primary/5", icon: "spinner" },
  researching: { border: "border-primary/25", bg: "bg-primary/5", icon: "spinner" },
  working: { border: "border-primary/35", bg: "bg-primary/7", icon: "spinner" },
  reviewing: { border: "border-warning/25", bg: "bg-warning/5", icon: "spinner" },
  completed: { border: "border-success/30", bg: "bg-success/5", icon: "check" },
  failed: { border: "border-error/30", bg: "bg-error/5", icon: "x" },
};

interface AgentNodeData {
  label: string;
  role: string;
  status: AgentStatus;
  confidence: number;
  outputs?: ProjectOutput[];
  onOutputClick?: (outputId: string) => void;
}

function StatusIcon({ status }: { status: AgentStatus }) {
  switch (statusConfig[status]?.icon) {
    case "spinner":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case "check":
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "x":
      return <XCircle className="h-4 w-4 text-[#ef4444]" />;
    default:
      return <Clock className="h-4 w-4 text-foreground-dim" />;
  }
}

function AgentNode({ data }: NodeProps<AgentNodeData>) {
  const status: AgentStatus = data.status || "idle";
  const config = statusConfig[status] || statusConfig.idle;
  const confidence = data.confidence ?? 0;
  const outputs = data.outputs ?? [];
  const isActive = status === "working" || status === "planning" || status === "researching";
  const isCompleted = status === "completed";
  const visibleOutputs = outputs.slice(0, 2);
  const hiddenCount = outputs.length - visibleOutputs.length;

  return (
    <div
      className={cn(
        "relative min-w-[210px] rounded-2xl border px-5 py-4 transition-all duration-500",
        config.border,
        config.bg,
        isActive && "scale-105",
        isCompleted && "scale-100",
      )}
    >
      {isActive && (
        <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-pulse" />
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-primary"
      />

      <div className="relative z-10 flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-500",
            isActive ? "border-primary/30 bg-primary/10" : "border-border bg-background",
          )}
        >
          <Bot className={cn("h-4 w-4", isActive ? "text-primary" : "text-foreground-dim")} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{data.label}</p>
          <p className="truncate text-[11px] capitalize text-foreground-dim">{data.role}</p>
        </div>

        <StatusIcon status={status} />
      </div>

      <div className="relative z-10 mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] text-foreground-dim">Confidence</span>
          <span
            className="text-[10px] font-medium tabular-nums"
            style={{ color: isCompleted ? "#10b981" : "var(--foundry-primary)" }}
          >
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-surface-hover">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.round(confidence * 100)}%`,
              background: isCompleted
                ? "#10b981"
                : isActive
                  ? "var(--foundry-primary)"
                  : "var(--foundry-border)",
            }}
          />
        </div>
      </div>

      {outputs.length > 0 && (
        <div className="agent-node-outputs">
          <span className="agent-node-outputs__label">
            Outputs ({outputs.length})
          </span>
          {visibleOutputs.map((output) => {
            const Icon = output.mimeType === "text/x-aiken" ? FileCode2 : FileText;
            return (
              <button
                key={output.id}
                type="button"
                className="agent-node-output-chip"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onOutputClick?.(output.id);
                }}
              >
                <Icon className="h-3 w-3 shrink-0 text-primary" />
                <span className="agent-node-output-chip__title">{output.title}</span>
              </button>
            );
          })}
          {hiddenCount > 0 && (
            <button
              type="button"
              className="agent-node-output-chip"
              onClick={(e) => {
                e.stopPropagation();
                data.onOutputClick?.(outputs[2]?.id ?? outputs[0].id);
              }}
            >
              <span className="agent-node-output-chip__more">+{hiddenCount} more file{hiddenCount === 1 ? "" : "s"}</span>
            </button>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-primary"
      />
    </div>
  );
}

export default memo(AgentNode);