"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

// Email verification is a UI-only concept for the demo; registration now
// signs you in directly against the real API.
export default function VerifyEmail() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/auth/login");
  }, [router]);
  return null;
}
