"use client";

import { AuthCard } from "@/components/shared/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export default function ForgotPassword() {
  const [sent, setSent] = React.useState(false);
  const [email, setEmail] = React.useState("");

  return (
    <AuthCard
      title={sent ? "Check your inbox" : "Reset password"}
      subtitle={sent ? undefined : "We'll send you a secure reset link."}
      footer={<Link href="/auth/login" className="text-cyan hover:underline">Back to sign in</Link>}
    >
      {sent ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="rounded-2xl bg-emerald/10 p-4"><MailCheck className="h-7 w-7 text-emerald" /></span>
          <p className="mt-4 text-sm text-muted">
            If an account exists for <span className="text-white">{email}</span>, a reset link is on its way.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) setSent(true);
          }}
          className="space-y-4"
        >
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthCard>
  );
}
