"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatAda, formatDate } from "@/lib/format";
import { hospitalClaims, mockHospital } from "@/lib/mock-data";
import { CircleDollarSign, Clock4, Receipt } from "lucide-react";

export default function HospitalPayouts() {
  const h = mockHospital;
  const paid = hospitalClaims.filter((c) => c.status === "paid");
  const pending = hospitalClaims.filter((c) => ["approved", "proof_verified", "submitted"].includes(c.status));

  return (
    <>
      <PageHeader title="Payout tracker" description="What the insurance pool owes, has paid, and is processing." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Total payable" value={formatAda(h.totalReceivableAda * 1_000_000)} icon={Receipt} accent="cyan" />
        <StatCard index={1} label="Paid to date" value={formatAda(h.paidAda * 1_000_000)} icon={CircleDollarSign} accent="emerald" />
        <StatCard index={2} label="Pending" value={formatAda(h.pendingAda * 1_000_000)} sub={`${pending.length} claims in pipeline`} icon={Clock4} accent="amber" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reimbursement progress</CardTitle>
          <Badge variant="cyan">{Math.round((h.paidAda / h.totalReceivableAda) * 100)}% settled</Badge>
        </CardHeader>
        <Progress value={h.paidAda} max={h.totalReceivableAda} barClassName="bg-gradient-to-r from-emerald to-cyan" />
        <div className="mt-3 flex justify-between text-xs text-subtle">
          <span>Paid {formatAda(h.paidAda * 1_000_000)}</span>
          <span>Outstanding {formatAda(h.pendingAda * 1_000_000)}</span>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <div className="p-6 pb-2"><CardTitle>Settled payouts</CardTitle></div>
          <Table>
            <THead><TR><TH>Claim</TH><TH>Amount</TH><TH>Date</TH></TR></THead>
            <TBody>
              {paid.map((c) => (
                <TR key={c.id}>
                  <TD className="font-mono text-xs">{c.reference}</TD>
                  <TD className="font-medium text-emerald">+{formatAda(c.amountAda * 1_000_000)}</TD>
                  <TD className="text-muted">{formatDate(c.submittedAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
        <Card className="p-0">
          <div className="p-6 pb-2"><CardTitle>In pipeline</CardTitle></div>
          <Table>
            <THead><TR><TH>Claim</TH><TH>Amount</TH><TH>Stage</TH></TR></THead>
            <TBody>
              {pending.map((c) => (
                <TR key={c.id}>
                  <TD className="font-mono text-xs">{c.reference}</TD>
                  <TD className="font-medium">{formatAda(c.amountAda * 1_000_000)}</TD>
                  <TD>
                    <Badge variant={c.status === "approved" ? "cyan" : c.status === "proof_verified" ? "violet" : "warning"} dot>
                      {c.status.replace("_", " ")}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
