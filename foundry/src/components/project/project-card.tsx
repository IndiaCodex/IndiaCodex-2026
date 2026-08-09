"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  Layers,
  Target,
  Tags,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/project";

const statusConfig: Record<string, { variant: "outline" | "warning" | "default" | "success" | "error"; label: string }> = {
  draft: { variant: "outline", label: "Draft" },
  forging: { variant: "warning", label: "Forging" },
  executing: { variant: "default", label: "Executing" },
  completed: { variant: "success", label: "Completed" },
  failed: { variant: "error", label: "Failed" },
};

const complexityColors: Record<string, string> = {
  simple: "border-green-500/30 text-green-400 bg-green-500/10",
  moderate: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  complex: "border-red-500/30 text-red-400 bg-red-500/10",
};

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const status = statusConfig[project.status] ?? statusConfig.draft;

  return (
    <Link href={`/projects/${project.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        className={cn(
          "group relative rounded-xl border border-border bg-card",
          "p-6 transition-all duration-300",
          "hover:border-primary/30 hover:bg-card-hover",
          "cursor-pointer",
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {project.name}
          </h3>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <p className="text-sm text-foreground-muted mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
              complexityColors[project.complexity] ?? "",
            )}
          >
            <Layers className="mr-1 h-3 w-3" />
            {project.complexity}
          </span>

          <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-foreground-muted">
            <Target className="mr-1 h-3 w-3" />
            {project.targetChain}
          </span>
        </div>

        {project.features.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <Tags className="h-3 w-3 text-foreground-muted mr-1" />
            {project.features.slice(0, 3).map((feature) => (
              <span
                key={feature}
                className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {feature}
              </span>
            ))}
            {project.features.length > 3 && (
              <span className="text-xs text-foreground-muted">
                +{project.features.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="flex items-center text-xs text-foreground-muted">
            <Clock className="mr-1 h-3 w-3" />
            {relativeTime(project.createdAt)}
          </span>
          <span className="flex items-center text-xs text-foreground-muted">
            <Users className="mr-1 h-3 w-3" />
            {project.companyId ? "1 company" : "No company"}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
