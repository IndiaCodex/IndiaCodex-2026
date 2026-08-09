"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { api, type PlanOut, type PolicyOut, type PoolStatusOut, type TransactionOut } from "@/lib/api";
import { formatAda, formatDate, timeAgo } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, EyeOff, Landmark, Percent, ShieldCheck, ShoppingBag, Wallet } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export default function UserDashboard() {
  const { session } = useAuth();
  const [policies, setPolicies] = React.useState<PolicyOut[] | null>(null);
  const [plans, setPlans] = React.useState<PlanOut[]>([]);
  const [pool, setPool] = React.useState<PoolStatusOut | null>(null);
  const [txs, setTxs] = React.useState<TransactionOut[]>([]);

  React.useEffect(() => {
    api.policies.mine().then(setPolicies).catch(() => setPolicies([]));
    api.plans.list().then(setPlans).catch(() => {});
    api.pool.status().then(setPool).catch(() => {});
    api.transactions.mine().then(setTxs).catch(() => {});
  }, []);

  const policy = policies?.find((p) => p.status === "active") ?? policies?.[0] ?? null;
  const plan = plans.find((p) => p.id === policy?.plan_id);
  const premiumsPaid = txs
    .filter((t) => t.type === "premium")
    .reduce((sum, t) => sum + t.amount_lovelace, 0);
  const allocPct = pool ? pool.current_allocation_bps / 100 : 0;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${session?.name ?? "there"}`}
        description={policy ? "Your coverage is live and the pool is working." : "Set up your private coverage in two minutes."}
        actions={
          policy ? (
            <Link href="/dashboard/claims/new"><Button>New claim</Button></Link>
          ) : (
            <Link href="/dashboard/buy"><Button><ShoppingBag className="h-4 w-4" /> Buy insurance</Button></Link>
          )
        }
      />

      {policies !== null && !policy ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="No policy yet"
            description="Link the demo wallet, pick a plan, and your premium is verified on-chain in seconds."
            action={
              <div className="flex gap-2">
                <Link href="/dashboard/wallet"><Button variant="secondary" size="sm"><Wallet className="h-4 w-4" /> Link wallet</Button></Link>
                <Link href="/dashboard/buy"><Button size="sm">Browse plans</Button></Link>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard index={0} label="Coverage" value={plan ? formatAda(plan.coverage_lovelace) : "—"} sub={plan?.name} icon={ShieldCheck} accent="cyan" />
          <StatCard index={1} label="Premiums paid" value={formatAda(premiumsPaid)} sub={policy?.next_premium_due ? `Next due ${formatDate(policy.next_premium_due)}` : undefined} icon={Wallet} accent="violet" />
          <StatCard index={2} label="Pool treasury" value={pool ? formatAda(pool.total_pool_lovelace) : "—"} sub={pool ? `${formatAda(pool.yield_earned_lovelace, 1)} yield earned` : undefined} icon={Landmark} accent="emerald" />
          <StatCard index={3} label="Pool deployed" value={`${allocPct.toFixed(1)}%`} sub="of 80% cap" icon={Percent} accent="amber" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity (live ledger)</CardTitle>
            <Link href="/dashboard/wallet" className="text-xs text-cyan hover:underline">View all</Link>
          </CardHeader>
          {txs.length === 0 ? (
            <EmptyState icon={ArrowDownLeft} title="No activity yet" description="Premiums and payouts will appear here." />
          ) : (
            <ul className="space-y-1">
              {txs.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center gap-3.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.04]">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.direction === "in" ? "bg-emerald/10 text-emerald" : "bg-violet/10 text-violet"}`}>
                    {t.direction === "in" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize">{t.type}</p>
                    <p className="truncate font-mono text-xs text-subtle">{t.tx_hash}</p>
                  </div>
                  <span className={`text-sm font-medium ${t.direction === "in" ? "text-emerald" : ""}`}>
                    {t.direction === "in" ? "+" : "−"}{formatAda(t.amount_lovelace, 1)}
                  </span>
                  <span className="shrink-0 text-xs text-subtle">{timeAgo(t.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          {policy && (
            <Card>
              <CardHeader>
                <CardTitle>Policy status</CardTitle>
                <Badge variant={policy.status === "active" ? "success" : "warning"} dot>
                  {policy.status}
                </Badge>
              </CardHeader>
              <div className="space-y-2">
                {policy.start_date && (
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                    <span className="text-xs text-subtle">Active since</span>
                    <span className="text-sm font-medium">{formatDate(policy.start_date)}</span>
                  </div>
                )}
                <div className="flex items-start gap-2.5 rounded-xl border border-violet/20 bg-violet/5 p-3">
                  <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
                  <p className="text-xs text-muted">
                    Commitment <span className="font-mono text-violet">{policy.commitment_hash.slice(0, 12)}…</span> is
                    registered in the private vault.
                  </p>
                </div>
              </div>
            </Card>
          )}
          {pool && (
            <Card>
              <CardHeader>
                <CardTitle>Pool snapshot (live)</CardTitle>
                <Landmark className="h-4 w-4 text-subtle" />
              </CardHeader>
              <p className="text-2xl font-semibold">{formatAda(pool.total_pool_lovelace)}</p>
              <p className="mt-1 text-xs text-subtle">
                {allocPct.toFixed(1)}% deployed · {formatAda(pool.liquid_lovelace)} liquid for claims
              </p>
              <Progress className="mt-3" value={allocPct} max={100} barClassName="bg-gradient-to-r from-violet to-emerald" />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
