"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

// Onboarding is folded into the dashboard now (wallet linking lives on the
// Wallet page, backed by the real API). This page just redirects.
export default function Onboarding() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
