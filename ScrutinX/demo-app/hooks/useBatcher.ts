"use client";

import { useCallback } from "react";
import { useBatcherStore } from "@/stores/useBatcherStore";
import { buildContentionGraph } from "@/lib/agent/conflictDetector";
import { selectBatch } from "@/lib/agent/optimizer";
import { generateClaimRush, type Preset } from "@/lib/engine/loadgen";
import { config } from "@/lib/agent/config";

const BURST = 24;

/**
 * The real batcher console actions:
 *   loadTickets — fetch the real Open tickets at the contract
 *   fireRush    — simulate a claim rush against those real tickets → contention graph + chosen batch (MIS)
 *   settle      — submit the chosen batch as ONE real Preprod transaction
 */
export function useBatcher() {
  const loadTickets = useCallback(async () => {
    const s = useBatcherStore.getState();
    s.setTicketsLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      s.setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      if (data.configured === false) {
        s.setError("On-chain not configured — set BLOCKFROST_PROJECT_ID + WALLET_SEED + SCRIPT_ADDRESS.");
      }
    } catch (e: any) {
      s.setError("Could not load tickets: " + (e?.message ?? e));
    } finally {
      s.setTicketsLoading(false);
    }
  }, []);

  const fireRush = useCallback(
    async (preset: Preset) => {
      // Always refresh against the live chain first so the rush never targets already-spent tickets.
      await loadTickets();
      const s = useBatcherStore.getState();
      if (s.tickets.length === 0) {
        s.setError("No Open tickets on-chain — run `npm run seed`, then try again.");
        return;
      }
      s.setError(null);
      const startTs = (s.results.length + 1) * 100000;
      const reqs = generateClaimRush(preset, s.tickets, BURST, startTs);
      const graph = buildContentionGraph(reqs);
      const cap = Math.min(config.batchCap, s.tickets.length);
      const batch = selectBatch(reqs, graph, s.score, cap);
      s.setQueue(reqs);
      s.setGraph(graph);
      s.setBatch(batch);
    },
    [loadTickets]
  );

  const settle = useCallback(async () => {
    const s = useBatcherStore.getState();
    const batch = s.currentBatch;
    if (!batch || batch.requests.length === 0) {
      s.setError("Nothing to settle — fire a claim rush first.");
      return;
    }
    s.setSettling(true);
    s.setError(null);
    try {
      const res = await fetch("/api/settle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(batch),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || `HTTP ${res.status}`);

      useBatcherStore.getState().addResult(result);
      // The rush is resolved: winners settled on-chain, contested losers "lost" (ticket is spent).
      useBatcherStore.getState().setQueue([]);
      useBatcherStore.getState().setGraph(null);
      useBatcherStore.getState().setBatch(null);
      // Reflect the newly-Claimed tickets once the tx confirms (~20-40s).
      setTimeout(loadTickets, 10000);
      setTimeout(loadTickets, 30000);
    } catch (e: any) {
      useBatcherStore.getState().setError("Settlement failed: " + (e?.message ?? e));
    } finally {
      useBatcherStore.getState().setSettling(false);
    }
  }, [loadTickets]);

  return { loadTickets, fireRush, settle };
}
