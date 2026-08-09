"use client";

import { ClaimTimeline } from "@/components/shared/claim-timeline";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type ClaimOut, type PolicyOut } from "@/lib/api";
import { formatAda } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Check, EyeOff, FileUp, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

type Stage = "details" | "proving" | "done";

const proofSteps = [
  "Loading policy commitment from vault…",
  "Hashing medical documents locally…",
  "Building eligibility witness…",
  "Generating zero-knowledge proof…",
  "Submitting to verifier…",
];

export default function NewClaim() {
  const { toast } = useToast();
  const [stage, setStage] = React.useState<Stage>("details");
  const [policies, setPolicies] = React.useState<PolicyOut[]>([]);
  const [policyId, setPolicyId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [files, setFiles] = React.useState<string[]>([]);
  const [proofStep, setProofStep] = React.useState(0);
  const [result, setResult] = React.useState<ClaimOut | null>(null);

  React.useEffect(() => {
    api.policies.mine().then((ps) => {
      const active = ps.filter((p) => p.status === "active");
      setPolicies(active);
      if (active[0]) setPolicyId(active[0].id);
    }).catch(() => {});
  }, []);

  function addFile() {
    const names = ["diagnosis_report.pdf", "invoice_0087.pdf", "lab_results.pdf"];
    setFiles((f) => [...f, `${names[f.length % names.length].replace(".pdf", "")}_${f.length + 1}.pdf`]);
  }

  async function startProof() {
    const lovelace = Math.round(Number(amount) * 1_000_000);
    const policy = policies.find((p) => p.id === policyId);
    if (!policy) return toast("error", "No active policy", "Buy insurance first.");
    if (!lovelace || lovelace <= 0) return toast("error", "Enter a claim amount in ADA");
    if (files.length === 0) return toast("error", "Attach at least one document", "They're hashed locally — never uploaded.");

    setStage("proving");
    setProofStep(0);
    for (let i = 0; i < proofSteps.length - 1; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setProofStep(i + 1);
    }
    try {
      // The real call: proof payload references the policy commitment.
      const claim = await api.claims.submit(policy.id, lovelace, {
        commitment: policy.commitment_hash,
        documents_hash: `sha256:${files.length}-docs-demo`,
      });
      setProofStep(proofSteps.length);
      setResult(claim);
      setStage("done");
      toast("success", "Claim submitted", `${claim.claim_reference} — proof verified.`);
    } catch (err) {
      setStage("details");
      toast("error", "Claim rejected", err instanceof ApiError ? err.message : "Backend unreachable.");
    }
  }

  return (
    <>
      <PageHeader
        title="Submit a claim"
        description="Eligibility is proven against your policy commitment — details never leave this device."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {stage === "details" && (
            <Card>
              {policies.length === 0 && (
                <div className="mb-4 rounded-xl border border-amber/20 bg-amber/5 p-3 text-xs text-muted">
                  No active policy found. <Link href="/dashboard/buy" className="text-amber underline">Buy insurance</Link> first.
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Policy</Label>
                  <Select value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.commitment_hash.slice(0, 18)}… ({p.status})
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Amount (ADA)</Label>
                  <Input type="number" placeholder="e.g. 640" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>
              <div className="mt-6">
                <Label>Medical documents</Label>
                <button
                  onClick={addFile}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-8 text-sm text-subtle transition-colors hover:border-cyan/40 hover:text-muted cursor-pointer"
                >
                  <FileUp className="h-6 w-6 text-cyan" />
                  Click to attach documents
                  <span className="text-xs">Hashed locally · never uploaded</span>
                </button>
                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((f) => (
                      <li key={f} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-2.5 text-sm">
                        <span className="flex items-center gap-2.5">
                          <Lock className="h-3.5 w-3.5 text-violet" />
                          <span className="font-mono text-xs">{f}</span>
                        </span>
                        <button onClick={() => setFiles(files.filter((x) => x !== f))} className="text-subtle hover:text-danger cursor-pointer">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button className="mt-6 w-full" size="lg" onClick={startProof} disabled={policies.length === 0}>
                <ShieldCheck className="h-4 w-4" /> Generate zero-knowledge proof
              </Button>
            </Card>
          )}

          {stage === "proving" && (
            <Card>
              <div className="flex flex-col items-center py-6">
                <div className="glow-violet relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet/20 to-cyan/20">
                  <EyeOff className="h-8 w-8 text-violet" />
                  <span className="absolute inset-0 animate-ping rounded-3xl border border-violet/30" />
                </div>
                <p className="mt-5 font-medium">Generating proof</p>
                <p className="mt-1 text-xs text-subtle">The API receives a proof — never your documents.</p>
              </div>
              <ul className="mx-auto max-w-md space-y-3 pb-4">
                {proofSteps.map((s, i) => (
                  <li key={s} className={cn("flex items-center gap-3 text-sm", i < proofStep ? "text-emerald" : i === proofStep ? "text-white" : "text-subtle")}>
                    {i < proofStep ? <Check className="h-4 w-4" /> : i === proofStep ? <Loader2 className="h-4 w-4 animate-spin text-cyan" /> : <span className="h-4 w-4 rounded-full border border-white/15" />}
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {stage === "done" && result && (
            <Card>
              <div className="flex flex-col items-center py-6 text-center">
                <span className="rounded-2xl bg-emerald/10 p-4"><Check className="h-8 w-8 text-emerald" /></span>
                <p className="mt-4 text-lg font-semibold">Claim {result.claim_reference} submitted</p>
                <Badge variant="violet" className="mt-2" dot>ZK proof verified · {formatAda(result.amount_lovelace)}</Badge>
              </div>
              <div className="mx-auto max-w-md">
                <ClaimTimeline
                  steps={[
                    { label: "Claim submitted", at: result.created_at, status: "done" },
                    { label: "ZK proof verified", description: "Verifier accepted the proof", status: "done" },
                    { label: "Pool approval", description: "Admin review in the admin portal", status: "active" },
                    { label: "Private payout", description: "Settlement from liquid pool funds", status: "pending" },
                  ]}
                />
                <Link href="/dashboard/claims">
                  <Button variant="secondary" className="mt-6 w-full">Back to claims</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <h3 className="text-sm font-semibold">What the API receives</h3>
          <div className="mt-3 space-y-2 font-mono text-xs">
            {[
              ["policy_id", "uuid", true],
              ["amount", "lovelace", true],
              ["proof_payload", "opaque blob", true],
              ["diagnosis", "—", false],
              ["documents", "—", false],
            ].map(([k, v, sent]) => (
              <div key={k as string} className="flex justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                <span className="text-subtle">{k}</span>
                <span className={sent ? "text-emerald" : "text-violet"}>{sent ? (v as string) : "never sent"}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
