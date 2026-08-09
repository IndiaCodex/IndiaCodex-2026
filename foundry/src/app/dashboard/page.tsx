"use client";

import { motion } from "framer-motion";
import { Hexagon, Sparkles } from "lucide-react";
import { pageTransition } from "@/animations/variants";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentProjects from "@/components/dashboard/recent-projects";
import ActivityFeed from "@/components/dashboard/activity-feed";
import HealthCharts from "@/components/dashboard/health-charts";

export default function Dashboard() {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="enter"
      className="page-gradient mx-auto max-w-7xl space-y-6 p-6 lg:p-8"
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            Live Dashboard
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Overview of your autonomous software companies
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 sm:flex">
          <Hexagon className="h-4 w-4 text-primary" />
          <span className="text-xs text-foreground-muted">Cardano Preprod</span>
          <span className="flex h-2 w-2 rounded-full bg-success" />
        </div>
      </div>

      <StatsCards />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentProjects />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>

      <HealthCharts />
    </motion.div>
  );
}
