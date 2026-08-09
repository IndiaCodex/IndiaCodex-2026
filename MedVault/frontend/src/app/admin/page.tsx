"use client";

import { GradientAreaChart } from "@/components/charts/area-chart";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatAda } from "@/lib/format";
import { adminGrowthSeries, adminStats, fraudAlerts, mockTreasury } from "@/lib/mock-data";
import { Building2, FileCheck2, HeartPulse, Landmark, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";

export default function AdminOverview() {
  const s = adminStats;
  const t = mockTreasury;
  return (
    <>
      <PageHeader title="Global analytics" description="Platform health across users, hospitals, treasury, and risk." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Total users" value={s.totalUsers.toLocaleString()} trend={8.9} icon={Users} accent="cyan" />
        <StatCard index={1} label="Active policies" value={s.activePolicies.toLocaleString()} trend={8.2} icon={FileCheck2} accent="violet" />
        <StatCard index={2} label="Hospitals" value={String(s.totalHospitals)} sub="4 pending verification" icon={Building2} accent="emerald" />
        <StatCard index={3} label="Treasury" value={formatAda(s.treasuryAda * 1_000_000)} trend={13.2} icon={Landmark} accent="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Platform growth</CardTitle>
              <p className="mt-1 text-xs text-subtle">Users and active policies</p>
            </div>
          </CardHeader>
          <GradientAreaChart data={adminGrowthSeries} dataKey="users" secondKey="policies" valueFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pool health</CardTitle>
              <HeartPulse className="h-4 w-4 text-emerald" />
            </CardHeader>
            <p className="text-3xl font-semibold text-emerald">{s.poolHealth}<span className="text-lg text-subtle">/100</span></p>
            <p className="mt-1 text-xs text-subtle">Solvency, liquidity & reserve composite</p>
            <Progress className="mt-3" value={s.poolHealth} barClassName="bg-gradient-to-r from-emerald to-cyan" />
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>80% allocation monitor</CardTitle>
              <Badge variant={t.currentAllocationPct > 79 ? "warning" : "cyan"}>{t.currentAllocationPct}%</Badge>
            </CardHeader>
            <Progress value={t.currentAllocationPct} max={80} />
            <p className="mt-2 text-xs text-subtle">
              {formatAda(t.allocatedAda * 1_000_000)} deployed of {formatAda((t.totalPoolAda * 0.8) * 1_000_000)} cap
            </p>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fraud alerts</CardTitle>
              <Link href="/admin/fraud"><ShieldAlert className="h-4 w-4 text-danger" /></Link>
            </CardHeader>
            <div className="space-y-2">
              {fraudAlerts.slice(0, 2).map((f) => (
                <div key={f.id} className="rounded-xl bg-white/[0.04] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{f.title}</p>
                    <Badge variant={f.severity === "high" ? "danger" : f.severity === "medium" ? "warning" : "default"}>{f.severity}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-subtle">{f.detail}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Pending claims", String(s.pendingClaims), "/admin/claims"],
          ["Pending loans", String(s.pendingLoans), "/admin/loans"],
          ["Interest collected", formatAda(t.interestEarnedAda * 1_000_000), "/admin/treasury"],
        ].map(([k, v, href]) => (
          <Link key={k} href={href}>
            <Card className="transition-all hover:border-cyan/30 hover:bg-white/[0.06]">
              <p className="text-xs uppercase tracking-wider text-subtle">{k}</p>
              <p className="mt-2 text-2xl font-semibold">{v}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
