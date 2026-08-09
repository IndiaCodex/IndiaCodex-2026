"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type AllocationOut, type PoolStatusOut } from "@/lib/api";
import { formatAda, formatDate } from "@/lib/format";
import { Banknote, Landmark, PiggyBank, Sparkles } from "lucide-react";
import * as React from "react";

export default function AdminTreasury() {
  const { toast } = useToast();
  const [pool, setPool] = React.useState<PoolStatusOut | null>(null);
  const [allocations, setAllocations] = React.useState<AllocationOut[]>([]);
  const [open, setOpen] = React.useState(false);
  const [strategy, setStrategy] = React.useState("Collateralized lending");
  const [amount, setAmount] = React.useState("");

  const load = React.useCallback(() => {
    api.pool.status().then(setPool).catch(() => {});
    api.pool.allocations().then(setAllocations).catch(() => {});
  }, []);
  React.useEffect(load, [load]);

  async function allocate() {
    const lovelace = Math.round(Number(amount) * 1_000_000);
    if (!lovelace || lovelace <= 0) return toast("error", "Enter an amount in ADA");
    try {
      await api.pool.allocate(strategy, lovelace);
      toast("success", "Allocation active", `${formatAda(lovelace)} → ${strategy}`);
      setOpen(false);
      setAmount("");
      load();
    } catch (err) {
      toast("error", "Allocation rejected", err instanceof ApiError ? err.message : "Backend unreachable.");
    }
  }

  async function withdraw(id: string) {
    try {
      await api.pool.withdraw(id);
      toast("success", "Allocation withdrawn", "Funds returned to the liquid pool.");
      load();
    } catch (err) {
      toast("error", "Withdraw failed", err instanceof ApiError ? err.message : "Backend unreachable.");
    }
  }

  const allocPct = pool ? pool.current_allocation_bps / 100 : 0;
  const capPct = pool ? pool.allocation_cap_bps / 100 : 80;

  return (
    <>
      <PageHeader
        title="Treasury management (live)"
        description="Deploy pool capital within the cap. The API enforces the invariant — try to break it."
        actions={<Button onClick={() => setOpen(true)}><Banknote className="h-4 w-4" /> New allocation</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Total pool" value={pool ? formatAda(pool.total_pool_lovelace) : "—"} icon={Landmark} accent="cyan" />
        <StatCard index={1} label="Deployed" value={pool ? formatAda(pool.allocated_lovelace) : "—"} sub={`${allocPct.toFixed(1)}% of pool`} icon={PiggyBank} accent="violet" />
        <StatCard index={2} label="Liquid" value={pool ? formatAda(pool.liquid_lovelace) : "—"} icon={Landmark} accent="emerald" />
        <StatCard index={3} label="Yield earned" value={pool ? formatAda(pool.yield_earned_lovelace, 1) : "—"} icon={Sparkles} accent="amber" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Allocation monitor</CardTitle>
          <Badge variant={allocPct >= capPct - 2 ? "warning" : "success"} dot>
            {allocPct.toFixed(1)}% / {capPct}% cap
          </Badge>
        </CardHeader>
        <Progress value={allocPct} max={100} />
      </Card>

      <Card className="mt-6 p-0">
        <div className="p-6 pb-2"><CardTitle>Allocations</CardTitle></div>
        {allocations.length === 0 ? (
          <EmptyState icon={PiggyBank} title="Nothing deployed" description="Pool capital is 100% liquid." />
        ) : (
          <Table>
            <THead>
              <TR><TH>Strategy</TH><TH>Amount</TH><TH>Target</TH><TH>Status</TH><TH>Created</TH><TH></TH></TR>
            </THead>
            <TBody>
              {allocations.map((a) => (
                <TR key={a.id}>
                  <TD>{a.strategy}</TD>
                  <TD className="font-medium">{formatAda(a.amount_lovelace)}</TD>
                  <TD>{(a.target_bps / 100).toFixed(1)}%</TD>
                  <TD>
                    <Badge variant={a.status === "active" ? "success" : "default"} dot>{a.status}</Badge>
                  </TD>
                  <TD className="text-muted">{formatDate(a.created_at)}</TD>
                  <TD>
                    {a.status === "active" && (
                      <Button size="sm" variant="ghost" onClick={() => withdraw(a.id)}>Withdraw</Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="New yield allocation">
        <div className="space-y-4">
          <div>
            <Label>Strategy</Label>
            <Select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
              <option>Collateralized lending</option>
              <option>ADA staking</option>
              <option>Stable LP</option>
            </Select>
          </div>
          <div>
            <Label>Amount (ADA)</Label>
            <Input type="number" placeholder="e.g. 30" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <p className="text-xs text-subtle">
            The API rejects anything past the {capPct}% cap with <span className="font-mono">allocation_cap_exceeded</span>.
          </p>
          <Button className="w-full" onClick={allocate}>Queue allocation</Button>
        </div>
      </Dialog>
    </>
  );
}
