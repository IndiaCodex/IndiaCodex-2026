"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/format";
import { hospitalPatients } from "@/lib/mock-data";
import { EyeOff, Loader2, Search, ShieldCheck, ShieldX } from "lucide-react";
import * as React from "react";

export default function HospitalPatients() {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [verifyOpen, setVerifyOpen] = React.useState(false);
  const [result, setResult] = React.useState<null | boolean>(null);
  const [ref, setRef] = React.useState("");

  const filtered = hospitalPatients.filter((p) => p.ref.toLowerCase().includes(query.toLowerCase()));

  function verify() {
    if (!ref) return toast("error", "Enter a patient reference");
    setVerifying(true);
    setResult(null);
    setTimeout(() => {
      setVerifying(false);
      setResult(true);
      toast("success", "Coverage proven", "ZK proof confirms active coverage — nothing else disclosed.");
    }, 1600);
  }

  return (
    <>
      <PageHeader
        title="Patients"
        description="Pseudonymous references only — you treat patients, the chain never names them."
        actions={<Button onClick={() => { setVerifyOpen(true); setResult(null); setRef(""); }}><ShieldCheck className="h-4 w-4" /> Verify insurance</Button>}
      />

      <Card className="mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input placeholder="Search patient reference…" className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <THead>
            <TR><TH>Reference</TH><TH>Policy tier</TH><TH>Coverage</TH><TH>Claims here</TH><TH>Last visit</TH></TR>
          </THead>
          <TBody>
            {filtered.map((p) => (
              <TR key={p.ref}>
                <TD className="font-mono text-xs">{p.ref}</TD>
                <TD>{p.policyTier}</TD>
                <TD>
                  {p.coverageOk ? (
                    <Badge variant="success" dot>Active</Badge>
                  ) : (
                    <Badge variant="danger" dot>Lapsed</Badge>
                  )}
                </TD>
                <TD>{p.claims}</TD>
                <TD className="text-muted">{formatDate(p.lastVisit)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-violet/20 bg-violet/5 p-4 text-xs text-muted">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
        Treatment history shown here is your hospital&apos;s own record (UI demo). MedVault never stores or
        transmits medical data — coverage checks are answered by zero-knowledge proofs.
      </div>

      <Dialog open={verifyOpen} onClose={() => setVerifyOpen(false)} title="Verify patient insurance">
        <div className="space-y-4">
          <Input placeholder="Patient reference, e.g. PT-8841" value={ref} onChange={(e) => setRef(e.target.value)} className="font-mono" />
          {result === null ? (
            <Button className="w-full" onClick={verify} disabled={verifying}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {verifying ? "Requesting ZK coverage proof…" : "Request coverage proof"}
            </Button>
          ) : (
            <div className="rounded-xl border border-emerald/25 bg-emerald/5 p-4 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-emerald" />
              <p className="mt-2 text-sm font-medium">Coverage proven</p>
              <p className="mt-1 text-xs text-muted">
                Proof confirms: active policy, procedure covered, limits not exceeded.
                <br />Not revealed: identity, diagnosis, balance, history.
              </p>
            </div>
          )}
          {result === null && !verifying && (
            <p className="flex items-center gap-1.5 text-xs text-subtle">
              <ShieldX className="h-3.5 w-3.5" /> The patient authorizes each proof from their wallet.
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}
