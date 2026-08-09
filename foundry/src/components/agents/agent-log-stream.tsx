"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { LogEntry } from "@/types/agent";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentLogStreamProps {
  logs: LogEntry[];
  className?: string;
}

const logStyles: Record<string, { color: string; prefix: string }> = {
  info: { color: "text-foreground-muted", prefix: "→" },
  warn: { color: "text-[#f59e0b]", prefix: "⚠" },
  error: { color: "text-[#ef4444]", prefix: "✕" },
  debug: { color: "text-foreground-dim", prefix: "·" },
};

export function AgentLogStream({ logs, className }: AgentLogStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <ScrollArea className={cn("h-full font-mono text-xs", className)}>
      <div className="space-y-1 p-4">
        {logs.length === 0 && (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-surface p-6">
            <p className="text-foreground-dim italic">No logs yet...</p>
          </div>
        )}
        {logs.map((log) => {
          const style = logStyles[log.level] || logStyles.info;
          return (
            <div
              key={log.id}
              className="flex items-baseline gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <span className="shrink-0 text-[10px] text-foreground-dim tabular-nums">
                {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className={cn("shrink-0", style.color)}>{style.prefix}</span>
              <span className={cn("break-all", style.color)}>{log.message}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
