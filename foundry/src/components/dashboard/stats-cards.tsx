"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  FolderKanban,
  Bot,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { useProjectStore } from "@/store/project-store";
import { useAgentStore } from "@/store/agent-store";

const statConfigs = [
  {
    icon: FolderKanban,
    label: "Active Projects",
    color: "#0033ad",
  },
  {
    icon: Bot,
    label: "Total Agents",
    color: "#1a4fc3",
  },
  {
    icon: CheckCircle2,
    label: "Projects Completed",
    color: "#10b981",
  },
  {
    icon: TrendingUp,
    label: "Engineering Hours Saved",
    color: "#f59e0b",
  },
];

function StatCard({ config, value, index }: { config: typeof statConfigs[0]; value: number | string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  const Icon = config.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-border-hover hover:bg-card-hover"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${config.color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color: config.color }} />
        </div>
        <div
          className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: `${config.color}15`, color: config.color }}
        >
          <ArrowUpRight className="h-3 w-3" />
          {index * 7 + 12}%
        </div>
      </div>

      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        <p className="mt-0.5 text-xs text-foreground-muted">{config.label}</p>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-hover">
        <motion.div
          className="h-full rounded-full"
          style={{ background: config.color }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${Math.min(Number(value) * (index === 0 ? 11 : index === 1 ? 5.5 : index === 2 ? 8 : 3), 100)}%` } : {}}
          transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

export default function StatsCards() {
  const projects = useProjectStore((s) => s.projects);
  const agents = useAgentStore((s) => s.agents);

  const activeProjects = projects.filter((p) => p.status === "executing" || p.status === "forging").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const totalAgents = agents.length || 9;
  const engineeringHours = Math.floor(completedProjects * 31);

  const values = [activeProjects, totalAgents, completedProjects, `~${engineeringHours}`];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {statConfigs.map((config, i) => (
        <StatCard key={config.label} config={config} value={values[i]} index={i} />
      ))}
    </div>
  );
}
