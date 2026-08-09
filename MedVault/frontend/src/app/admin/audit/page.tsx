"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api, type AuditLogOut } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { ScrollText, Search } from "lucide-react";
import * as React from "react";

const actionVariant: Record<string, "cyan" | "success" | "warning" | "danger" | "violet"> = {
  APPROVE_CLAIM: "violet", REJECT_CLAIM: "danger", PAYOUT_CLAIM: "success",
  ALLOCATE_FUNDS: "cyan", WITHDRAW_ALLOCATION: "warning",
};

export default function AdminAudit() {
  const [logs, setLogs] = React.useState<AuditLogOut[] | null>(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    api.auditLogs().then(setLogs).catch(() => setLogs([]));
  }, []);

  const filtered = (logs ?? []).filter(
    (l) =>
      l.action.toLowerCase().includes(query.toLowerCase()) ||
      (l.entity_id ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Audit logs (live)" description="Every privileged action, straight from the database." />
      <Card className="mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input placeholder="Filter by action or entity…" className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </Card>
      <Card className="p-0">
        {logs !== null && filtered.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audit entries" description="Approve a claim or allocate funds to generate some." />
        ) : (
          <Table>
            <THead>
              <TR><TH>Action</TH><TH>Entity</TH><TH>Entity ID</TH><TH>Timestamp</TH></TR>
            </THead>
            <TBody>
              {filtered.map((l) => (
                <TR key={l.id}>
                  <TD><Badge variant={actionVariant[l.action] ?? "cyan"}>{l.action}</Badge></TD>
                  <TD className="text-muted">{l.entity}</TD>
                  <TD className="font-mono text-xs">{l.entity_id ?? "—"}</TD>
                  <TD className="text-muted">{formatDateTime(l.created_at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
