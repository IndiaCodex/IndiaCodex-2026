import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Ouro App — Borrow tUSDM against tADA",
};

/**
 * App-route chrome. Wallet providers and the dashboard shell live here so
 * the marketing landing at "/" ships none of the CIP-30 / Mesh SDK weight.
 */
export default function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <AppProviders>
      <AppShell>{children}</AppShell>
    </AppProviders>
  );
}
