"use client";

import { ClaimTimeline } from "@/components/shared/claim-timeline";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatAda, formatDate } from "@/lib/format";
import { hospitalClaims } from "@/lib/mock-data";
import { Download, Search, ShieldCheck, ShieldX } from "lucide-react";
import * as React from "react";

type Claim = (typeof hospitalClaims)[number];

const statusBadge: Record<string, { variant: "success" | "cyan" | "warning" | "danger" | "violet"; label: string }> = {
  paid: { variant: "success", label: "Paid" },
  approved: { variant: "cyan", label: "Approved" },
  proof_verified: { variant: "violet", label: "Proof verified" },
  submitted: { variant: "warning", label: "Submitted" },
  rejected: { variant: "danger", label: "Rejected" },
};

export default function HospitalClaims() {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Claim | null>(null);

  const filtered = hospitalClaims.filter((c) => {
    const q = query.toLowerCase();
    const matches =
      c.reference.toLowerCase().includes(q) ||
      c.patientRef.toLowerCase().includes(q) ||
      c.procedureType.toLowerCase().includes(q);
    return matches && (filter === "all" || c.status === filter);
  });

  return (
    <>
      <PageHeader
        title="Claims workflow"
        description="Verify coverage and process claims — patient identities stay pseudonymous."
        actions={
          <Button variant="secondary" onClick={() => toast("success", "Report exported", "claims_jul_2026.csv downloaded.")}>
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <Card className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input placeholder="Search reference, patient, procedure…" className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select className="sm:w-52" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="proof_verified">Proof verified</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <THead>
            <TR><TH>Reference</TH><TH>Patient</TH><TH>Procedure</TH><TH>Amount</TH><TH>ZK proof</TH><TH>Status</TH><TH></TH></TR>
          </THead>
          <TBody>
            {filtered.map((c) => {
              const s = statusBadge[c.status];
              return (
                <TR key={c.id}>
                  <TD className="font-mono text-xs">{c.reference}</TD>
                  <TD className="font-mono text-xs text-muted">{c.patientRef}</TD>
                  <TD>{c.procedureType}</TD>
                  <TD className="font-medium">{formatAda(c.amountAda * 1_000_000)}</TD>
                  <TD>
                    {c.zkVerified ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald"><ShieldCheck className="h-4 w-4" /> Valid</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-subtle"><ShieldX className="h-4 w-4" /> Pending</span>
                    )}
                  </TD>
                  <TD><Badge variant={s.variant} dot>{s.label}</Badge></TD>
                  <TD><Button variant="ghost" size="sm" onClick={() => setSelected(c)}>Details</Button></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected?.reference}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Patient ref", selected.patientRef],
                ["Procedure", selected.procedureType],
                ["Amount", formatAda(selected.amountAda * 1_000_000)],
                ["Submitted", formatDate(selected.submittedAt)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/[0.04] px-4 py-3">
                  <p className="text-xs text-subtle">{k}</p>
                  <p className="mt-0.5 text-sm font-medium">{v}</p>
                </div>
              ))}
            </div>
            <ClaimTimeline
              steps={[
                { label: "Submitted by patient", at: selected.submittedAt, status: "done" },
                { label: "ZK eligibility proof", description: selected.zkVerified ? "Verified by Midnight circuit" : "Awaiting proof", status: selected.zkVerified ? "done" : "active" },
                { label: "Pool approval", status: ["approved", "paid"].includes(selected.status) ? "done" : selected.status === "rejected" ? "pending" : "active" },
                { label: "Payout to hospital", status: selected.status === "paid" ? "done" : "pending" },
              ]}
            />
            <div className="flex gap-2">
              <Button
                variant="success"
                className="flex-1"
                onClick={() => { toast("success", "Treatment confirmed", `${selected.reference} attested to the pool.`); setSelected(null); }}
              >
                Attest treatment
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => { toast("warning", "Claim disputed", "Flagged for pool review."); setSelected(null); }}
              >
                Dispute
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
