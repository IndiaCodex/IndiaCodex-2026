"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, mockDepositTx, type PlanOut } from "@/lib/api";
import { formatAda } from "@/lib/format";
import { Check, Loader2, Lock } from "lucide-react";
import * as React from "react";

export default function BuyInsurance() {
  const { toast } = useToast();
  const [plans, setPlans] = React.useState<PlanOut[] | null>(null);
  const [selected, setSelected] = React.useState<PlanOut | null>(null);
  const [stage, setStage] = React.useState<"summary" | "paying" | "done">("summary");

  React.useEffect(() => {
    api.plans.list().then(setPlans).catch(() =>
      toast("error", "Could not load plans", "Is the backend running? Did you run seed_plans?")
    );
  }, [toast]);

  async function purchase(plan: PlanOut) {
    setStage("paying");
    try {
      // Deposits must come from a wallet THIS user has proven they own.
      const wallets = await api.wallets.list();
      const verified = wallets.find((w) => w.is_verified);
      if (!verified) {
        setStage("summary");
        return toast("error", "Link your wallet first", "Go to Wallet → Link demo wallet, then retry.");
      }
      // 1. Enroll -> creates the pending policy + private commitment.
      //    If a previous attempt already enrolled (e.g. the deposit failed),
      //    resume with the existing open policy instead of failing.
      let policy;
      try {
        policy = await api.policies.enroll(plan.id);
      } catch (err) {
        if (err instanceof ApiError && err.code === "conflict") {
          const mine = await api.policies.mine();
          policy = mine.find(
            (p) => p.plan_id === plan.id && (p.status === "pending" || p.status === "active")
          );
          if (!policy) throw err;
          if (policy.status === "active") {
            setStage("done");
            return toast("info", "Already covered", "This policy is active — premium already paid.");
          }
        } else {
          throw err;
        }
      }
      // 2. Pay the premium. Dev mode: the mock chain accepts a fabricated tx
      //    from your linked wallet. (Production: Mesh SDK signs a real tx.)
      await api.premiums.deposit(
        policy.id,
        mockDepositTx(verified.address, plan.premium_lovelace)
      );
      setStage("done");
      toast("success", "Policy active", "Premium verified — commitment registered privately.");
    } catch (err) {
      setStage("summary");
      if (err instanceof ApiError && err.message.includes("verified wallets")) {
        toast("error", "Link your wallet first", "Go to Wallet → Link demo wallet, then retry.");
      } else if (err instanceof ApiError && err.code === "conflict") {
        toast("warning", "Already enrolled", "You have an open policy for this plan.");
      } else {
        toast("error", "Purchase failed", err instanceof ApiError ? err.message : "Backend unreachable.");
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Buy insurance"
        description="Live plans from the API. Enrollment registers a private commitment; the premium is verified on-chain."
      />
      {plans === null ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-80" />)}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((p, i) => (
            <Card key={p.id} className={i === 1 ? "border-violet/40" : ""}>
              {i === 1 && <Badge variant="violet" className="mb-3">Most popular</Badge>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-xs text-subtle">{p.description}</p>
              <p className="mt-4 text-3xl font-semibold">
                {formatAda(p.premium_lovelace)}
                <span className="text-sm font-normal text-subtle">/mo</span>
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-muted">
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald" /> {formatAda(p.coverage_lovelace)} coverage</li>
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald" /> {p.max_claims_per_year} claims / year</li>
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald" /> ZK claim privacy</li>
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald" /> Yield-bearing pool share</li>
              </ul>
              <Button
                className="mt-6 w-full"
                variant={i === 1 ? "primary" : "secondary"}
                onClick={() => { setSelected(p); setStage("summary"); }}
              >
                Select {p.name}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={stage === "done" ? "Enrollment complete" : "Payment summary"}
      >
        {selected && stage !== "done" && (
          <div className="space-y-3">
            {[
              ["Plan", selected.name],
              ["Coverage", formatAda(selected.coverage_lovelace)],
              ["Monthly premium", formatAda(selected.premium_lovelace)],
              ["Network", "Cardano preprod (mock chain in dev)"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-sm">
                <span className="text-subtle">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
            <div className="flex items-start gap-2.5 rounded-xl border border-violet/20 bg-violet/5 p-3 text-xs text-muted">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
              Enrolling registers a shielded commitment. The pool records a deposit — not who you are.
            </div>
            <Button className="w-full" onClick={() => purchase(selected)} disabled={stage === "paying"}>
              {stage === "paying" && <Loader2 className="h-4 w-4 animate-spin" />}
              {stage === "paying" ? "Verifying deposit on-chain…" : "Enroll & pay premium"}
            </Button>
          </div>
        )}
        {selected && stage === "done" && (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="rounded-2xl bg-emerald/10 p-4"><Check className="h-8 w-8 text-emerald" /></span>
            <p className="mt-4 font-medium">You&apos;re covered by {selected.name}.</p>
            <p className="mt-1 text-xs text-muted">Deposit verified · policy active · commitment registered.</p>
            <Button className="mt-5 w-full" variant="secondary" onClick={() => setSelected(null)}>Done</Button>
          </div>
        )}
      </Dialog>
    </>
  );
}
