"use client";

import { motion } from "framer-motion";
import { Activity, Shield } from "lucide-react";
import { useProjectStore } from "@/store/project-store";
import { useExecutionStore } from "@/store/execution-store";

function DonutChart({ percentage, color }: { percentage: number; color: string }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg className="h-36 w-36 -rotate-90" viewBox="0 0 140 140">
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="10"
      />
      <motion.circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function HealthCharts() {
  const projects = useProjectStore((s) => s.projects);
  const execution = useExecutionStore();

  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const totalProjects = projects.length;
  const projectSuccessRate = totalProjects > 0
    ? Math.round((completedProjects / totalProjects) * 100)
    : 0;

  const deploymentScore = Math.min(
    85 + completedProjects * 3 + (execution.totalCost > 0 ? 5 : 0),
    99,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">Deployment Readiness</h3>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <DonutChart percentage={deploymentScore} color="#0033ad" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{deploymentScore}%</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-foreground-muted">
            {deploymentScore >= 90
              ? "Ready for testnet deployment"
              : "Complete more projects to improve readiness"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">Project Health</h3>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="relative flex h-36 w-full items-center justify-center">
            <div className="text-center">
              <div className="relative mx-auto mb-4 h-28 w-28">
                <svg className="h-full w-full" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#1a4fc3"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="339.292"
                    initial={{ strokeDashoffset: 339.292 }}
                    animate={{ strokeDashoffset: 339.292 - (projectSuccessRate / 100) * 339.292 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    opacity={0.3}
                  />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#0033ad"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="339.292"
                    initial={{ strokeDashoffset: 339.292 }}
                    animate={{ strokeDashoffset: 339.292 - (projectSuccessRate / 100) * 339.292 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {projectSuccessRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-foreground-muted">
            {totalProjects === 0
              ? "No projects yet"
              : `${completedProjects}/${totalProjects} projects completed successfully`}
          </p>
        </div>
      </div>
    </div>
  );
}
