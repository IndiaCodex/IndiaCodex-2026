"use client";

import { AuthCard } from "@/components/shared/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export default function UserLogin() {
  const { loginBackend } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return toast("error", "Missing details", "Enter your email and password.");
    setBusy(true);
    try {
      await loginBackend(email, password);
      toast("success", "Welcome back", "Signed in to your private vault.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Is the backend running on port 8000?";
      toast("error", "Sign in failed", msg);
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Access your private insurance vault"
      badge={<Badge variant="cyan" dot>Live API</Badge>}
      footer={
        <>
          New here? <Link href="/auth/register" className="text-cyan hover:underline">Create an account</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <Link href="/auth/forgot-password" className="mb-1.5 text-xs text-cyan hover:underline">Forgot?</Link>
          </div>
          <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
