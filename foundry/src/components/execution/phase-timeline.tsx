"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAgentStore } from "@/store/agent-store";
import { getSystemPromptForAgent } from "@/prompts";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  Coins,
  BrainCircuit,
  FileText,
  MessageSquare,
  Terminal,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

function statusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "working":
    case "planning":
    case "researching":
    case "reviewing":
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-foreground-dim" />;
  }
}

function SectionHeader({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-dim mb-1.5">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      {count !== undefined && (
        <span className="text-foreground-dim ml-auto">{count}</span>
      )}
    </div>
  );
}

export function PhaseTimeline() {
  const agents = useAgentStore((s) => s.agents);
  const [expanded, setExpanded] = useState<string | null>(null);

  const executed = agents.filter((a) => a.status !== "idle");
  if (executed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-xs text-foreground-dim p-4 text-center">
        <Clock className="h-8 w-8 mb-2 opacity-30" />
        No agents have executed yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {executed.map((agent) => {
        const isOpen = expanded === agent.id;
        const prompt = getSystemPromptForAgent(agent.config.role);
        const outputStr =
          agent.output && typeof agent.output === "object"
            ? JSON.stringify(agent.output, null, 2)
            : String(agent.output ?? "");

        return (
          <div key={agent.id}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : agent.id)}
              className="btn-list-item btn-list-item--flat"
            >
              <div className="shrink-0">{statusIcon(agent.status)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {agent.config.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-foreground-dim capitalize">
                    {agent.config.role.replace(/-/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground-dim">
                  <span className="flex items-center gap-0.5">
                    <Coins className="h-3 w-3" />
                    {(agent.cost / 1_000_000).toFixed(2)} ₳
                  </span>
                  {agent.duration > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {(agent.duration / 1000).toFixed(1)}s
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span>
                    {Math.round(agent.confidence * 100)}%
                  </span>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-foreground-dim shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-foreground-dim shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-3">
                    {/* Output */}
                    {outputStr && outputStr !== "null" && (
                      <div>
                        <SectionHeader icon={FileText} label="Output" />
                        <pre className="rounded-lg bg-surface p-2 text-[11px] font-mono text-foreground-muted overflow-x-auto max-h-32 overflow-y-auto leading-relaxed">
                          {outputStr.length > 500
                            ? outputStr.slice(0, 500) + "..."
                            : outputStr}
                        </pre>
                      </div>
                    )}

                    {/* Reasoning */}
                    {agent.reasoning.length > 0 && (
                      <div>
                        <SectionHeader
                          icon={BrainCircuit}
                          label="Reasoning"
                          count={agent.reasoning.length}
                        />
                        <div className="space-y-0.5">
                          {agent.reasoning.map((r, i) => (
                            <p
                              key={i}
                              className="rounded px-2 py-1 text-xs text-foreground-muted bg-surface"
                            >
                              <span className="text-foreground-dim mr-1">
                                {i + 1}.
                              </span>
                              {r}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Logs */}
                    {agent.logs.length > 0 && (
                      <div>
                        <SectionHeader
                          icon={Terminal}
                          label="Logs"
                          count={agent.logs.length}
                        />
                        <div className="rounded-lg bg-black/30 p-2 space-y-0.5 max-h-24 overflow-y-auto">
                          {agent.logs.map((log) => (
                            <p
                              key={log.id}
                              className="text-[11px] font-mono leading-relaxed"
                            >
                              <span
                                className={cn(
                                  "mr-1.5 font-semibold",
                                  log.level === "error" && "text-red-400",
                                  log.level === "warn" && "text-yellow-400",
                                  log.level === "info" && "text-foreground-dim",
                                )}
                              >
                                [{log.level.toUpperCase()}]
                              </span>
                              <span className="text-foreground-muted">
                                {log.message}
                              </span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prompt */}
                    <div>
                      <SectionHeader icon={MessageSquare} label="System Prompt" />
                      <div className="rounded-lg bg-surface p-2">
                        <p className="text-[11px] text-foreground-muted leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                          {prompt}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
