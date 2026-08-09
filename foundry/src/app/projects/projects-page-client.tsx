"use client";

import { motion } from "framer-motion";
import { FolderOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProjectCard } from "@/components/project/project-card";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/project-store";

export default function ProjectsPageClient() {
  const projects = useProjectStore((s) => s.projects);

  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-surface shadow-[var(--shadow-card)]">
          <FolderOpen className="h-10 w-10 text-foreground-muted" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          No projects yet
        </h2>
        <p className="text-foreground-muted mb-8 max-w-md">
          Create your first autonomous software company and let AI agents build
          your Cardano dApp from concept to deployment.
        </p>
        <Link href="/projects/new">
          <Button variant="default" size="lg" className="gap-2">
            Create Your First Company
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
