"use client";

import { AuthCard } from "@/components/shared/auth-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { KeyRound } from "lucide-react";
import * as React from "react";

export function MfaScreen({
  fallbackName,
  fallbackEmail,
  accent,
}: {
  role?: string;
  fallbackName: string;
  fallbackEmail: string;
  accent: "cyan" | "violet";
}) {
  const { loginHospital } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const pending = React.useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(sessionStorage.getItem("medvault.mfa") ?? "null") as { email: string } | null;
    } catch { return null; }
  }, []);

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  }

  function verify() {
    if (code.join("").length < 6) return toast("error", "Enter all 6 digits");
    const email = pending?.email ?? fallbackEmail;
    const name = email.split("@")[0].replace(/^\w/, (c) => c.toUpperCase()) || fallbackName;
    loginHospital(name, email);
    toast("success", "MFA verified", "Hospital session established (demo).");
  }

  return (
    <AuthCard
      title="Two-factor authentication"
      subtitle="Enter the code from your authenticator app. (Demo: any digits work.)"
      badge={<Badge variant={accent === "violet" ? "violet" : "cyan"} dot><KeyRound className="h-3 w-3" /> Step 2 of 2</Badge>}
    >
      <div className="flex justify-between gap-2">
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
            }}
            className="h-13 w-12 rounded-xl border border-white/10 bg-white/5 text-center text-lg font-semibold outline-none transition-colors focus:border-cyan/50 focus:ring-2 focus:ring-cyan/20"
            inputMode="numeric"
            maxLength={1}
          />
        ))}
      </div>
      <Button className="mt-6 w-full" onClick={verify}>Verify & sign in</Button>
    </AuthCard>
  );
}
