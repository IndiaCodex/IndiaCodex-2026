"use client";

import { cn } from "@/lib/utils";
import type { AgentMemory } from "@/types/agent";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  CheckCircle2,
  XCircle,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { extractPatterns } from "@/services/memory/memory-service";

interface AgentMemoryViewProps {
  memory: AgentMemory;
  className?: string;
}

export function AgentMemoryView({ memory, className }: AgentMemoryViewProps) {
  const patterns = extractPatterns(memory);

  const sections = [
    {
      icon: History,
      label: "Previous Tasks",
      items: memory.previousTasks,
      color: "text-primary",
      emptyMsg: "No tasks completed yet",
    },
    {
      icon: CheckCircle2,
      label: "Successful Patterns",
      items: memory.successfulPatterns,
      color: "text-success",
      emptyMsg: "None recorded",
    },
    {
      icon: XCircle,
      label: "Failures",
      items: memory.failures,
      color: "text-error",
      emptyMsg: "No failures recorded",
    },
    {
      icon: Lightbulb,
      label: "Preferred Strategies",
      items: memory.preferredStrategies,
      color: "text-warning",
      emptyMsg: "No strategies recorded",
    },
  ];

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-4 p-3">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg border border-border bg-surface p-3 text-center">
            <TrendingUp className="h-4 w-4 text-success mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">
              {patterns.successRate.toFixed(0)}%
            </p>
            <p className="text-[10px] text-foreground-muted">Success Rate</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3 text-center">
            <AlertTriangle className="h-4 w-4 text-warning mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">
              {patterns.commonFailures.length}
            </p>
            <p className="text-[10px] text-foreground-muted">Failure Types</p>
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.label}>
            <div className="flex items-center gap-2 mb-2">
              <section.icon className={cn("h-3 w-3", section.color)} />
              <span className="text-xs font-medium text-foreground-muted">
                {section.label}
              </span>
              {section.items.length > 0 && (
                <span className="text-[10px] text-foreground-muted ml-auto">
                  {section.items.length}
                </span>
              )}
            </div>
            {section.items.length === 0 ? (
              <p className="text-xs text-foreground-muted italic ml-5">
                {section.emptyMsg}
              </p>
            ) : (
              <ul className="space-y-1 ml-5">
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground-muted flex gap-2"
                  >
                    <span className="text-muted-foreground shrink-0">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {memory.recentOutputs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <History className="h-3 w-3 text-secondary" />
              <span className="text-xs font-medium text-foreground-muted">
                Recent Outputs
              </span>
            </div>
            <ul className="space-y-1 ml-5">
              {memory.recentOutputs.slice(-5).map((output, i) => (
                <li key={i} className="text-xs text-foreground-muted flex gap-2">
                  <span className="text-muted-foreground shrink-0">•</span>
                  <span className="truncate">
                    {typeof output === "string"
                      ? output.slice(0, 100)
                      : JSON.stringify(output).slice(0, 100)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
