"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type ClaimOut } from "@/lib/api";
import { formatAda, formatDate } from "@/lib/format";
import { EyeOff, FileCheck2, ShieldCheck } from "lucide-react";
import * as React from "react";

const statusVariant: Record<string, "success" | "cyan" | "warning" | "danger" | "violet"> = {
  paid: "success", approved: "cyan", proof_verified: "violet",
  submitted: "warning", rejected: "danger",
};

export default function AdminClaims() {
  const { toast } = useToast();
  const [claims, setClaims] = React.useState<ClaimOut[] | null>(null);

  const load = React.useCallback(() => {
    api.claims.all().then(setClaims).catch(() => setClaims([]));
  }, []);
  React.useEffect(load, [load]);

  async function act(id: string, action: "approve" | "reject" | "payout") {
    try {
      await api.claims[action](id);
      toast("success", `Claim ${action === "payout" ? "paid" : action + "d"}`);
      load();
    } catch (err) {
      toast("error", `${action} failed`, err instanceof ApiError ? err.message : "Backend unreachable.");
    }
  }

  return (
    <>
      <PageHeader
        title="Claim approvals (live)"
        description="Real claims from the API. You decide on proofs and amounts — never on medical files."
      />
      <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-violet/20 bg-violet/5 p-4 text-xs text-muted">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
        Payouts are checked against pool liquidity — if too much is deployed to strategies, the API refuses with
        <span className="font-mono text-violet"> insufficient_liquidity</span>.
      </div>
      <Card className="p-0">
        <div className="p-6 pb-2"><CardTitle>All claims ({claims?.length ?? "…"})</CardTitle></div>
        {claims !== null && claims.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No claims yet" description="User-submitted claims appear here." />
        ) : (
          <Table>
            <THead>
              <TR><TH>Reference</TH><TH>Amount</TH><TH>ZK proof</TH><TH>Submitted</TH><TH>Status</TH><TH></TH></TR>
            </THead>
            <TBody>
              {(claims ?? []).map((c) => (
                <TR key={c.id}>
                  <TD className="font-mono text-xs">{c.claim_reference}</TD>
                  <TD className="font-medium">{formatAda(c.amount_lovelace)}</TD>
                  <TD>
                    <span className="flex items-center gap-1.5 text-xs text-emerald">
                      <ShieldCheck className="h-4 w-4" /> Valid
                    </span>
                  </TD>
                  <TD className="text-muted">{formatDate(c.created_at)}</TD>
                  <TD><Badge variant={statusVariant[c.status] ?? "warning"} dot>{c.status.replace("_", " ")}</Badge></TD>
                  <TD>
                    <div className="flex gap-1.5">
                      {c.status === "proof_verified" && (
                        <>
                          <Button size="sm" variant="success" onClick={() => act(c.id, "approve")}>Approve</Button>
                          <Button size="sm" variant="ghost" onClick={() => act(c.id, "reject")}>Reject</Button>
                        </>
                      )}
                      {c.status === "approved" && (
                        <Button size="sm" onClick={() => act(c.id, "payout")}>Pay out</Button>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
