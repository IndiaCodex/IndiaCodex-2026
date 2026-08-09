"use client";

import { motion } from "framer-motion";
import { Target, Layers, Building2, FileOutput, Download, AlertCircle, PlayCircle, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CompanyOrgChart } from "@/components/company/company-org-chart";
import { CompanySummary } from "@/components/company/company-summary";
import { ProjectOutputs } from "@/components/project/project-outputs";
import { useProjectStore } from "@/store/project-store";
import { useAgentStore } from "@/store/agent-store";
import { useShallow } from "zustand/react/shallow";

const statusVariantMap: Record<string, "outline" | "default" | "success" | "error"> = {
  draft: "outline",
  forging: "default",
  executing: "default",
  completed: "success",
  failed: "error",
};

const complexityColors: Record<string, string> = {
  simple: "border-success/30 text-success bg-success/10",
  moderate: "border-warning/30 text-warning bg-warning/10",
  complex: "border-error/30 text-error bg-error/10",
};

interface ProjectDetailClientProps {
  projectId: string;
}

export default function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const outputs = useProjectStore(useShallow((s) => s.outputs.filter((o) => o.projectId === projectId)));
  const agents = useAgentStore((s) => s.agents);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="h-12 w-12 text-foreground-muted mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Project not found</h2>
        <p className="text-foreground-muted mt-2">This project doesn&apos;t exist or has been removed.</p>
        <Link href="/projects" className="mt-6">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {project.name}
            </h1>
            <p className="text-foreground-muted text-sm leading-relaxed max-w-2xl">
              {project.description}
            </p>
          </div>
          <Badge variant={statusVariantMap[project.status] || "outline"}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize",
              complexityColors[project.complexity] || "",
            )}
          >
            <Layers className="mr-1.5 h-3 w-3" />
            {project.complexity}
          </span>
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-foreground-muted">
            <Target className="mr-1.5 h-3 w-3" />
            {project.targetChain}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Link href={`/projects/${projectId}/execution`}>
            <Button size="sm" className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Execute
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/outputs`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Outputs
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/deploy`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Rocket className="h-4 w-4" />
              Deploy
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Company Org Chart</h2>
        </div>
        <CompanyOrgChart agents={agents} />
      </div>

      {project.summary && (
        <div className="rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Execution Summary</h2>
          <CompanySummary summary={project.summary} />
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileOutput className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Generated Outputs</h2>
          </div>
          {outputs.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download All
            </Button>
          )}
        </div>
        <ProjectOutputs outputs={outputs} />
      </div>
    </motion.div>
  );
}
