"use client";

import { AuthCard } from "@/components/shared/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export default function Register() {
  const { registerBackend, loginBackend } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || form.password.length < 8) {
      return toast("error", "Check your details", "Password must be at least 8 characters.");
    }
    setBusy(true);
    try {
      await registerBackend(form.email, form.password);
      toast("success", "Account created", "Signing you in…");
      await loginBackend(form.email, form.password);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Is the backend running on port 8000?";
      toast("error", "Registration failed", msg);
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Private by default. Nothing medical is ever stored."
      badge={<Badge variant="cyan" dot>Live API</Badge>}
      footer={
        <>
          Already covered? <Link href="/auth/login" className="text-cyan hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-emerald/5 border border-emerald/15 p-3 text-xs text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
          Argon2-hashed password, JWT sessions, zero medical data at rest. This account hits the real API.
        </div>
        <Button className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </Button>
      </form>
    </AuthCard>
  );
}
