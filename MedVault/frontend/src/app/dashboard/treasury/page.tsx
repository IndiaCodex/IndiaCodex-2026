"use client";

import { GradientAreaChart } from "@/components/charts/area-chart";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api, type PoolStatusOut } from "@/lib/api";
import { treasurySeries } from "@/lib/mock-data";
import { formatAda } from "@/lib/format";
import { Landmark, Percent, PiggyBank, Sparkles } from "lucide-react";
import * as React from "react";

export default function TreasuryPage() {
  const [pool, setPool] = React.useState<PoolStatusOut | null>(null);

  React.useEffect(() => {
    api.pool.status().then(setPool).catch(() => {});
  }, []);

  const allocPct = pool ? pool.current_allocation_bps / 100 : 0;
  const capPct = pool ? pool.allocation_cap_bps / 100 : 80;

  return (
    <>
      <PageHeader
        title="Treasury"
        description="Live pool accounting — computed from the on-ledger transaction history."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Insurance pool" value={pool ? formatAda(pool.total_pool_lovelace) : "—"} icon={Landmark} accent="cyan" />
        <StatCard index={1} label="Funds deployed" value={pool ? formatAda(pool.allocated_lovelace) : "—"} sub={`${allocPct.toFixed(1)}% of pool`} icon={PiggyBank} accent="violet" />
        <StatCard index={2} label="Yield earned" value={pool ? formatAda(pool.yield_earned_lovelace, 1) : "—"} icon={Sparkles} accent="emerald" />
        <StatCard index={3} label="Claims paid" value={pool ? formatAda(pool.claims_paid_lovelace) : "—"} icon={Percent} accent="amber" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Liquidity guardrail (live)</CardTitle>
            <p className="mt-1 text-xs text-subtle">
              Deployment capped at {capPct}% — the API rejects allocations beyond it, and payouts beyond liquid funds.
            </p>
          </div>
          <Badge variant={allocPct > capPct - 2 ? "warning" : "cyan"}>
            {allocPct.toFixed(1)}% / {capPct}% cap
          </Badge>
        </CardHeader>
        <Progress value={allocPct} max={100} />
        <div className="mt-3 flex justify-between text-xs text-subtle">
          <span>Deployed {pool ? formatAda(pool.allocated_lovelace) : "—"}</span>
          <span>Liquid {pool ? formatAda(pool.liquid_lovelace) : "—"}</span>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Growth trajectory</CardTitle>
            <p className="mt-1 text-xs text-subtle">Illustrative projection — historical series endpoint planned</p>
          </div>
          <Badge variant="default">Illustrative</Badge>
        </CardHeader>
        <GradientAreaChart data={treasurySeries} dataKey="pool" secondKey="yield" valueFormatter={(v) => `₳${v}M`} />
      </Card>
    </>
  );
}
