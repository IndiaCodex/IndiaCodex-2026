"use client";

import { GradientAreaChart } from "@/components/charts/area-chart";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatAda, formatDate } from "@/lib/format";
import { hospitalClaims, hospitalRevenueSeries, mockHospital } from "@/lib/mock-data";
import { CircleDollarSign, Clock4, FileCheck2, TrendingUp } from "lucide-react";
import Link from "next/link";

const statusBadge: Record<string, { variant: "success" | "cyan" | "warning" | "danger" | "violet"; label: string }> = {
  paid: { variant: "success", label: "Paid" },
  approved: { variant: "cyan", label: "Approved" },
  proof_verified: { variant: "violet", label: "Proof verified" },
  submitted: { variant: "warning", label: "Submitted" },
  rejected: { variant: "danger", label: "Rejected" },
};

export default function HospitalDashboard() {
  const h = mockHospital;
  return (
    <>
      <PageHeader
        title={h.name}
        description="Insurance receivables, claims, and payouts at a glance."
        actions={<Link href="/hospital/claims"><Button>Review claims</Button></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Total receivable" value={formatAda(h.totalReceivableAda * 1_000_000)} icon={CircleDollarSign} accent="cyan" />
        <StatCard index={1} label="Already paid" value={formatAda(h.paidAda * 1_000_000)} trend={11.4} icon={FileCheck2} accent="emerald" />
        <StatCard index={2} label="Pending reimbursement" value={formatAda(h.pendingAda * 1_000_000)} sub={`${hospitalClaims.filter(c => c.status !== "paid" && c.status !== "rejected").length} open claims`} icon={Clock4} accent="amber" />
        <StatCard index={3} label="Approval rate" value={`${h.approvalRate}%`} sub={`${h.claimsThisMonth} claims this month`} icon={TrendingUp} accent="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Insurance revenue</CardTitle>
              <p className="mt-1 text-xs text-subtle">Payouts received from MedVault pool (₳ thousands)</p>
            </div>
            <Badge variant="success" dot>+10.5% MoM</Badge>
          </CardHeader>
          <GradientAreaChart data={hospitalRevenueSeries} dataKey="revenue" color="#8b5cf6" valueFormatter={(v) => `₳${v}k`} />
        </Card>

        <Card>
          <CardHeader><CardTitle>Verification status</CardTitle><Badge variant="success" dot>Verified</Badge></CardHeader>
          <div className="space-y-2">
            {[
              ["License", h.license],
              ["Network since", "Jan 2026"],
              ["Region", "North"],
              ["Payout address", "addr1q9h…d8cc"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-sm">
                <span className="text-subtle">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-0">
        <div className="flex items-center justify-between p-6 pb-2">
          <CardTitle>Latest claims</CardTitle>
          <Link href="/hospital/claims" className="text-xs text-cyan hover:underline">View all</Link>
        </div>
        <Table>
          <THead>
            <TR><TH>Reference</TH><TH>Patient</TH><TH>Procedure</TH><TH>Amount</TH><TH>Submitted</TH><TH>Status</TH></TR>
          </THead>
          <TBody>
            {hospitalClaims.slice(0, 4).map((c) => {
              const s = statusBadge[c.status];
              return (
                <TR key={c.id}>
                  <TD className="font-mono text-xs">{c.reference}</TD>
                  <TD className="font-mono text-xs text-muted">{c.patientRef}</TD>
                  <TD>{c.procedureType}</TD>
                  <TD className="font-medium">{formatAda(c.amountAda * 1_000_000)}</TD>
                  <TD className="text-muted">{formatDate(c.submittedAt)}</TD>
                  <TD><Badge variant={s.variant} dot>{s.label}</Badge></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
