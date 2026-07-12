import { describe, it, expect } from "vitest";
import { generateClaimRush, type Preset, type Ticket } from "./loadgen";
import { buildContentionGraph } from "@/lib/agent/conflictDetector";
import { selectBatch } from "@/lib/agent/optimizer";
import { settleBatch } from "@/lib/agent/settlement";
import { config } from "@/lib/agent/config";
import type { SettlementResult } from "@/lib/agent/types";

const mkTickets = (n: number): Ticket[] =>
  Array.from({ length: n }, (_, i) => ({ ref: `tx${i}#0`, itemId: `ticket${i}` }));

/**
 * Headless integration check of the pipeline logic: claim rush → contention graph → MIS →
 * settleBatch → re-run on the losers, until resolved. (Uses the offline settleBatch for fee math;
 * the app itself always settles for real via /api/settle.)
 */
async function runToDrain(preset: Preset, count: number, tickets: number) {
  let queue = generateClaimRush(preset, mkTickets(tickets), count, 1000);
  let cycles = 0;
  let settled = 0;
  let saved = 0;
  const results: SettlementResult[] = [];

  while (queue.length > 0 && cycles < 200) {
    cycles++;
    const graph = buildContentionGraph(queue);
    const batch = selectBatch(queue, graph, 0.3, config.batchCap);
    if (batch.requests.length === 0) break;

    // every proposed batch must be conflict-free (validator would accept it)
    const targets = batch.requests.map((r) => r.targetUtxoRef);
    expect(new Set(targets).size).toBe(targets.length);

    const r = await settleBatch(batch);
    results.push(r);
    settled += r.batchSize;
    saved += r.savedLovelace;

    const done = new Set(batch.requests.map((x) => x.id));
    queue = queue.filter((x) => !done.has(x.id));
  }
  return { cycles, settled, saved, remaining: queue.length, results };
}

describe("end-to-end pipeline (demo mode)", () => {
  it("heavy contention drains over multiple cycles; all settled; fees saved", async () => {
    const r = await runToDrain("heavy", 24, 12);
    expect(r.remaining).toBe(0); // everyone eventually settles
    expect(r.settled).toBe(24);
    expect(r.cycles).toBeGreaterThan(1); // heavy → small MIS each round → many rounds
    expect(r.saved).toBeGreaterThan(0);
    expect(r.results.every((x) => x.mode === "demo")).toBe(true);
    // each settlement must have a distinct txHash (React key uniqueness; heavy cycles reuse the same tickets)
    const hashes = r.results.map((x) => x.txHash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("spread within the cap settles in a single cycle", async () => {
    const n = Math.min(5, config.batchCap); // distinct tickets ≤ cap → one batch
    const r = await runToDrain("spread", n, n);
    expect(r.remaining).toBe(0);
    expect(r.settled).toBe(n);
    expect(r.cycles).toBe(1);
    expect(r.results).toHaveLength(1);
    expect(r.results[0].savedLovelace).toBeGreaterThan(0);
  });

  it("batched fee is far cheaper than the naive per-tx sum", async () => {
    const r = await runToDrain("spread", 12, 12);
    const batchedFee = r.results.reduce((a, x) => a + x.feeLovelace, 0);
    const naiveFee = r.results.reduce((a, x) => a + x.naiveFeeEstimate, 0);
    expect(batchedFee).toBeLessThan(naiveFee); // the whole value prop, asserted
  });
});
