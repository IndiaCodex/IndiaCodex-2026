"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  accent = "cyan",
  index = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  trend?: number;
  accent?: "cyan" | "violet" | "emerald" | "amber";
  index?: number;
}) {
  const accents = {
    cyan: "text-cyan bg-cyan/10",
    violet: "text-violet bg-violet/10",
    emerald: "text-emerald bg-emerald/10",
    amber: "text-amber bg-amber/10",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card className="hover:bg-white/[0.06]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-subtle">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
            {trend !== undefined && (
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                  trend >= 0 ? "text-emerald" : "text-danger"
                )}
              >
                {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(trend)}% this month
              </p>
            )}
          </div>
          <span className={cn("rounded-xl p-2.5", accents[accent])}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
