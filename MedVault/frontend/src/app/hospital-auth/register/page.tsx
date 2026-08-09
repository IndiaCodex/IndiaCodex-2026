"use client";

import { AuthCard } from "@/components/shared/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export default function HospitalRegister() {
  const [sent, setSent] = React.useState(false);

  return (
    <AuthCard
      title={sent ? "Request received" : "Partner onboarding"}
      subtitle={sent ? undefined : "Apply to join the MedVault provider network."}
      badge={<Badge variant="violet" dot><Building2 className="h-3 w-3" /> Hospital portal</Badge>}
      footer={<Link href="/hospital-auth/login" className="text-violet hover:underline">Back to hospital sign in</Link>}
    >
      {sent ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="rounded-2xl bg-emerald/10 p-4"><CheckCircle2 className="h-7 w-7 text-emerald" /></span>
          <p className="mt-4 text-sm text-muted">
            Our compliance team will verify your license and reach out within 2 business days.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          className="space-y-4"
        >
          <div>
            <Label>Hospital name</Label>
            <Input placeholder="Nova Medica Center" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>License number</Label>
              <Input placeholder="MED-LIC-…" required />
            </div>
            <div>
              <Label>Region</Label>
              <Select><option>North</option><option>South</option><option>East</option><option>West</option></Select>
            </div>
          </div>
          <div>
            <Label>Administrator email</Label>
            <Input type="email" placeholder="admin@hospital.org" required />
          </div>
          <div>
            <Label>Cardano payout address</Label>
            <Input placeholder="addr1…" className="font-mono text-xs" />
          </div>
          <Button className="w-full">Submit for verification</Button>
        </form>
      )}
    </AuthCard>
  );
}
