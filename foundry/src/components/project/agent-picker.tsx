"use client";

import { Check, Info, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentRole } from "@/types/execution";
import {
  CORE_AGENT_ROLES,
  SPECIALIST_AGENTS,
  getAgentMeta,
} from "@/config/agent-scope";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface AgentPickerProps {
  selected: AgentRole[];
  recommended: AgentRole[];
  onChange: (agents: AgentRole[]) => void;
  onResetToRecommended?: () => void;
}

export function AgentPicker({
  selected,
  recommended,
  onChange,
  onResetToRecommended,
}: AgentPickerProps) {
  const selectedSet = new Set(selected);
  const recommendedSet = new Set(recommended);

  const toggle = (role: AgentRole) => {
    if (CORE_AGENT_ROLES.includes(role)) return;

    const next = new Set(selectedSet);
    if (next.has(role)) {
      next.delete(role);
    } else {
      next.add(role);
    }
    onChange([...next]);
  };

  const optionalCount = selected.filter((r) => !CORE_AGENT_ROLES.includes(r)).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Choose your team</p>
          <p className="text-xs text-foreground-dim">
            AI picked a starting roster — toggle specialists on or off. Research and Architecture
            always run.
          </p>
        </div>
        {onResetToRecommended && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onResetToRecommended}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Reset to AI pick
          </Button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {SPECIALIST_AGENTS.map((agent) => {
          const isSelected = selectedSet.has(agent.role);
          const isCore = CORE_AGENT_ROLES.includes(agent.role);
          const isRecommended = recommendedSet.has(agent.role);

          return (
            <button
              key={agent.role}
              type="button"
              disabled={isCore}
              onClick={() => toggle(agent.role)}
              className={cn(
                "btn-card group relative",
                isSelected && "btn-card--selected",
                isCore && "cursor-default opacity-100",
              )}
              aria-pressed={isSelected}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-transparent",
                )}
              >
                {isCore ? (
                  <Lock className="h-3 w-3 text-foreground-dim" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{agent.label}</span>
                  {isRecommended && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      AI pick
                    </span>
                  )}
                  <Tooltip content={agent.tooltip} side="top">
                    <span
                      className="inline-flex rounded-full p-0.5 text-foreground-dim transition-colors hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Info className="h-3.5 w-3.5" aria-label={`About ${agent.label}`} />
                    </span>
                  </Tooltip>
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-foreground-muted">
                  {agent.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-foreground-dim">
        {selected.length} specialist{selected.length === 1 ? "" : "s"} selected
        {optionalCount > 0 ? ` (${optionalCount} optional)` : ""} + CEO orchestrator at runtime.
        {selected.includes("deployment-engineer") &&
          !selected.includes("documentation-engineer") &&
          " Documentation is added automatically when Deployment is selected."}
      </p>
    </div>
  );
}

export function AgentPickerSummary({ agents }: { agents: AgentRole[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        CEO
      </span>
      {agents.map((role) => {
        const meta = getAgentMeta(role);
        return (
          <Tooltip key={role} content={meta?.tooltip ?? role} side="top">
            <span className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground">
              {meta?.label ?? role}
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}