"use client";

import { useEffect } from "react";
import { useBatcher } from "@/hooks/useBatcher";
import { useCongestion } from "@/hooks/useCongestion";
import { Header } from "@/components/layout/Header";
import { LoadGenControls } from "@/components/controls/LoadGenControls";
import { FeesSavedCounter } from "@/components/fees/FeesSavedCounter";
import { BeforeAfter } from "@/components/fees/BeforeAfter";
import { NaivePanel } from "@/components/panels/NaivePanel";
import { BatcherPanel } from "@/components/panels/BatcherPanel";
import { OnChainProof } from "@/components/proof/OnChainProof";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Page() {
  const { loadTickets } = useBatcher();
  useCongestion(); // polls /api/congestion → store.score

  useEffect(() => {
    loadTickets(); // load the real Open tickets on mount
  }, [loadTickets]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <Header />
      <LoadGenControls />

      <div className="grid gap-4 md:grid-cols-2">
        <FeesSavedCounter />
        <BeforeAfter />
      </div>

      <ErrorBoundary label="On-chain proof">
        <OnChainProof />
      </ErrorBoundary>

      <div className="grid gap-6 md:grid-cols-2">
        <ErrorBoundary label="Naive panel">
          <NaivePanel />
        </ErrorBoundary>
        <ErrorBoundary label="Batcher panel">
          <BatcherPanel />
        </ErrorBoundary>
      </div>

      <footer className="border-t border-border pt-4 text-center text-xs text-muted">
        Real on-chain batcher · Cardano Preprod. Fire a claim rush against live tickets, then settle the
        non-conflicting batch in one transaction — every settlement is a real tx on Cardanoscan.
      </footer>
    </main>
  );
}
