"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api, type ClaimOut } from "@/lib/api";
import { formatAda, formatDate } from "@/lib/format";
import { FileText } from "lucide-react";
import Link from "next/link";
import * as React from "react";

const statusBadge: Record<string, { variant: "success" | "cyan" | "warning" | "danger" | "violet"; label: string }> = {
  paid: { variant: "success", label: "Paid" },
  approved: { variant: "cyan", label: "Approved" },
  proof_verified: { variant: "violet", label: "Proof verified" },
  submitted: { variant: "warning", label: "Submitted" },
  rejected: { variant: "danger", label: "Rejected" },
};

export default function ClaimsPage() {
  const [claims, setClaims] = React.useState<ClaimOut[] | null>(null);

  React.useEffect(() => {
    api.claims.mine().then(setClaims).catch(() => setClaims([]));
  }, []);

  return (
    <>
      <PageHeader
        title="Claims"
        description="Live from the API — every claim verified by (mock) zero-knowledge proof."
        actions={<Link href="/dashboard/claims/new"><Button>Submit claim</Button></Link>}
      />
      <Card className="p-0">
        {claims === null ? null : claims.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No claims yet"
            description="Submit a claim and watch it move through proof verification, approval, and private payout."
            action={<Link href="/dashboard/claims/new"><Button size="sm">Submit your first claim</Button></Link>}
          />
        ) : (
          <Table>
            <THead>
              <TR><TH>Reference</TH><TH>Amount</TH><TH>Submitted</TH><TH>Payout tx</TH><TH>Status</TH></TR>
            </THead>
            <TBody>
              {claims.map((c) => {
                const s = statusBadge[c.status] ?? statusBadge.submitted;
                return (
                  <TR key={c.id}>
                    <TD className="font-mono text-xs">{c.claim_reference}</TD>
                    <TD className="font-medium">{formatAda(c.amount_lovelace)}</TD>
                    <TD className="text-muted">{formatDate(c.created_at)}</TD>
                    <TD className="max-w-32 truncate font-mono text-xs text-subtle">{c.payout_tx_hash ?? "—"}</TD>
                    <TD><Badge variant={s.variant} dot>{s.label}</Badge></TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
