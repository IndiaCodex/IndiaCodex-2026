"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

// Admin MFA is handled at login for the demo; this page just redirects.
export default function AdminMfa() {
  const router = useRouter();
  React.useEffect(() => { router.replace("/admin-auth/login"); }, [router]);
  return null;
}
