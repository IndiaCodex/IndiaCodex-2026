"use client";

import { AuthCard } from "@/components/shared/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function HospitalLogin() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return toast("error", "Missing details");
    setBusy(true);
    sessionStorage.setItem("medvault.mfa", JSON.stringify({ role: "hospital", email }));
    setTimeout(() => router.push("/hospital-auth/mfa"), 800);
  }

  return (
    <AuthCard
      title="Hospital sign in"
      subtitle="For verified healthcare providers"
      badge={<Badge variant="violet" dot><Building2 className="h-3 w-3" /> Hospital portal</Badge>}
      footer={
        <>
          Not a partner yet? <Link href="/hospital-auth/register" className="text-violet hover:underline">Request onboarding</Link>
          <span className="mx-2 text-subtle">·</span>
          <Link href="/auth/login" className="text-subtle hover:text-muted">User sign in</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Institution email</Label>
          <Input type="email" placeholder="admin@hospital.org" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <Link href="/auth/forgot-password" className="mb-1.5 text-xs text-violet hover:underline">Forgot?</Link>
          </div>
          <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Continue to MFA
        </Button>
      </form>
    </AuthCard>
  );
}
