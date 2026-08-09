"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { FolderKanban, ArrowRight, FileText, ExternalLink } from "lucide-react";
import { useProjectStore } from "@/store/project-store";

const statusConfig = {
  completed: { label: "Completed", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  executing: { label: "Executing", color: "#0033ad", bg: "rgba(0,51,173,0.1)" },
  forging: { label: "Forging", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  draft: { label: "Draft", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  failed: { label: "Failed", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export default function RecentProjects() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  const projects = useProjectStore((s) => s.projects);

  const sorted = [...projects]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-muted">
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recent Projects</h3>
            <p className="text-xs text-foreground-muted">{projects.length} total</p>
          </div>
        </div>
        {projects.length > 0 && (
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-muted"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="mb-3 h-8 w-8 text-foreground-dim" />
          <p className="text-sm text-foreground-muted">No projects yet</p>
          <Link
            href="/projects/new"
            className="mt-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {sorted.map((project, i) => {
            const status = statusConfig[project.status] ?? statusConfig.draft;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="group flex items-center justify-between px-6 py-3.5 transition-all duration-200 hover:bg-surface"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hover transition-colors group-hover:bg-primary/10">
                      <FileText className="h-3.5 w-3.5 text-foreground-muted transition-colors group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {project.name}
                      </p>
                      <p className="text-xs text-foreground-dim">
                        {new Date(project.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        color: status.color,
                        background: status.bg,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: status.color }}
                      />
                      {status.label}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-foreground-dim opacity-0 transition-all duration-200 group-hover:opacity-100" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
