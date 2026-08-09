"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { adminUsers } from "@/lib/mock-data";
import { EyeOff, Search } from "lucide-react";
import * as React from "react";

export default function AdminUsers() {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const filtered = adminUsers.filter(
    (u) => u.ref.toLowerCase().includes(query.toLowerCase()) && (status === "all" || u.status === status)
  );

  return (
    <>
      <PageHeader title="User management" description="Pseudonymous references — the platform never learns who members are." />
      <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-violet/20 bg-violet/5 p-4 text-xs text-muted">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
        Even admins see only commitments and status. Identity resolution is cryptographically impossible from this console.
      </div>
      <Card className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input placeholder="Search reference…" className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select className="sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="lapsed">Lapsed</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
      </Card>
      <Card className="p-0">
        <Table>
          <THead>
            <TR><TH>Reference</TH><TH>Tier</TH><TH>Status</TH><TH>Joined</TH><TH>Claims</TH><TH></TH></TR>
          </THead>
          <TBody>
            {filtered.map((u) => (
              <TR key={u.id}>
                <TD className="font-mono text-xs">{u.ref}</TD>
                <TD>{u.tier}</TD>
                <TD>
                  <Badge variant={u.status === "active" ? "success" : u.status === "lapsed" ? "warning" : "danger"} dot>
                    {u.status}
                  </Badge>
                </TD>
                <TD className="text-muted">{u.joined}</TD>
                <TD>{u.claims}</TD>
                <TD>
                  <Button size="sm" variant="ghost" onClick={() => toast("info", u.status === "suspended" ? "User reinstated" : "User suspended", `${u.ref} updated.`)}>
                    {u.status === "suspended" ? "Reinstate" : "Suspend"}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
