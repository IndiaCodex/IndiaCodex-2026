"use client";

import { AuthCard } from "@/components/shared/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import * as React from "react";

export default function AdminLogin() {
  const { loginBackend } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return toast("error", "Missing credentials");
    setBusy(true);
    try {
      await loginBackend(email, password);
      toast("success", "Admin session established");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Is the backend running?";
      toast("error", "Sign in failed", msg);
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Administrator access"
      subtitle="Restricted. All actions are audit-logged."
      badge={<Badge variant="danger" dot><Lock className="h-3 w-3" /> Platform admin · Live API</Badge>}
    >
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber/20 bg-amber/5 p-3 text-xs text-muted">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
        Accounts get admin rights via <code className="text-amber">python -m scripts.create_admin</code>.
        A non-admin account will be routed to the user dashboard.
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Admin email</Label>
          <Input type="email" placeholder="admin@medvault.io" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
