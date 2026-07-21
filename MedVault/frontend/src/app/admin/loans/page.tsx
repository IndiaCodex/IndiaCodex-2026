"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatAda } from "@/lib/format";
import { adminLoans, mockTreasury } from "@/lib/mock-data";
import { Banknote, CircleDollarSign, Landmark } from "lucide-react";
import * as React from "react";

export default function AdminLoans() {
  const { toast } = useToast();
  const [loans, setLoans] = React.useState(adminLoans);
  const t = mockTreasury;

  function decide(id: string, ok: boolean) {
    setLoans((ls) => ls.map((l) => (l.id === id ? { ...l, status: ok ? ("active" as const) : ("rejected" as never) } : l)));
    toast(ok ? "success" : "warning", ok ? "Loan approved" : "Loan rejected", ok ? "Funds scheduled for deployment." : "Proposal returned to originator.");
  }

  return (
    <>
      <PageHeader title="Loan portfolio" description="Interest-generating allocations from the insurance treasury." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Outstanding" value={formatAda(t.outstandingLoansAda * 1_000_000)} sub={`${t.activeLoans} active loans`} icon={Banknote} accent="cyan" />
        <StatCard index={1} label="Interest collected" value={formatAda(t.interestEarnedAda * 1_000_000)} trend={9.7} icon={CircleDollarSign} accent="emerald" />
        <StatCard index={2} label="Avg collateral ratio" value="175%" sub="Liquidation floor 140%" icon={Landmark} accent="violet" />
      </div>

      <Card className="mt-6 p-0">
        <div className="p-6 pb-2"><CardTitle>Loan book</CardTitle></div>
        <Table>
          <THead>
            <TR><TH>ID</TH><TH>Borrower / venue</TH><TH>Principal</TH><TH>APR</TH><TH>Collateral</TH><TH>Maturity</TH><TH>Status</TH><TH></TH></TR>
          </THead>
          <TBody>
            {loans.map((l) => (
              <TR key={l.id}>
                <TD className="font-mono text-xs">{l.id}</TD>
                <TD>{l.borrower}</TD>
                <TD className="font-medium">{formatAda(l.principalAda * 1_000_000)}</TD>
                <TD className="text-emerald">{l.apr}%</TD>
                <TD className={l.collateralRatio < 165 ? "text-amber" : ""}>{l.collateralRatio}%</TD>
                <TD className="text-muted">{l.maturity}</TD>
                <TD>
                  <Badge variant={l.status === "active" ? "success" : l.status === "pending" ? "warning" : "danger"} dot>
                    {l.status}
                  </Badge>
                </TD>
                <TD>
                  {l.status === "pending" && (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="success" onClick={() => decide(l.id, true)}>Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => decide(l.id, false)}>Reject</Button>
                    </div>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
