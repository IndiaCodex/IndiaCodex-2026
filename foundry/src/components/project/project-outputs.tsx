"use client";

import { motion } from "framer-motion";
import {
  FileText,
  ScrollText,
  Code2,
  Layout,
  Shield,
  BookOpen,
  Rocket,
  BadgeCheck,
  FolderOpen,
  Download,
  Clock,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProjectOutput } from "@/types/project";

const typeIconMap: Record<string, React.ElementType> = {
  readme: FileText,
  architecture: ScrollText,
  contract: Code2,
  frontend: Layout,
  security: Shield,
  docs: BookOpen,
  deployment: Rocket,
  catalyst: BadgeCheck,
};

const typeLabelMap: Record<string, string> = {
  readme: "README",
  architecture: "Architecture",
  contract: "Contract",
  frontend: "Frontend",
  security: "Security",
  docs: "Documentation",
  deployment: "Deployment",
  catalyst: "Catalyst",
};

interface ProjectOutputsProps {
  outputs: ProjectOutput[];
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ProjectOutputs({ outputs }: ProjectOutputsProps) {
  if (outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-border bg-card px-6 py-16 text-center shadow-[var(--shadow-card)]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background">
          <FolderOpen className="h-8 w-8 text-foreground-muted" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          No outputs generated yet
        </h3>
        <p className="text-sm text-foreground-muted max-w-sm">
          Outputs from your agents will appear here once execution begins.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {outputs.map((output, index) => {
        const Icon = typeIconMap[output.type] ?? FileText;
        const label = typeLabelMap[output.type] ?? output.type;
        return (
          <motion.div
            key={output.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
            className={cn(
              "group flex items-center gap-4 rounded-2xl border border-border",
              "bg-card p-4 transition-colors duration-200 shadow-[var(--shadow-card)]",
              "hover:border-border-hover hover:bg-surface",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {output.title}
                </span>
                <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                  {label}
                </Badge>
                {output.sourceAgentRole && (
                  <Badge variant="outline" className="shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0">
                    <Cpu className="h-3 w-3" />
                    {output.sourceAgentRole.replace(/-/g, " ")}
                  </Badge>
                )}
              </div>
              <span className="mt-1 flex items-center text-xs text-foreground-muted">
                <Clock className="mr-1 h-3 w-3" />
                {relativeTime(output.createdAt)}
              </span>
            </div>

            <Button variant="ghost" size="icon" className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
              <Download className="h-4 w-4" />
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}
