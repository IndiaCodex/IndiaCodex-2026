import { describe, it, expect } from "vitest";
import { generateClaimRush, type Ticket } from "./loadgen";
import { buildContentionGraph } from "@/lib/agent/conflictDetector";

function tickets(n: number): Ticket[] {
  return Array.from({ length: n }, (_, i) => ({ ref: `tx${i}#0`, itemId: `ticket${i}` }));
}

describe("generateClaimRush (against real tickets)", () => {
  it("produces the requested count with unique ids", () => {
    const reqs = generateClaimRush("heavy", tickets(12), 20, 1000);
    expect(reqs).toHaveLength(20);
    expect(new Set(reqs.map((r) => r.id)).size).toBe(20);
  });

  it("spread targets distinct tickets → no conflicts", () => {
    const reqs = generateClaimRush("spread", tickets(12), 12, 1000);
    const g = buildContentionGraph(reqs);
    expect(g.edges).toHaveLength(0);
    expect(reqs).toHaveLength(12);
  });

  it("heavy piles onto few tickets → many conflicts", () => {
    const reqs = generateClaimRush("heavy", tickets(12), 24, 1000);
    const g = buildContentionGraph(reqs);
    expect(g.edges.length).toBeGreaterThan(0);
    expect(new Set(reqs.map((r) => r.targetUtxoRef)).size).toBeLessThanOrEqual(3);
  });

  it("every request targets a real ticket ref", () => {
    const ts = tickets(5);
    const refs = new Set(ts.map((t) => t.ref));
    const reqs = generateClaimRush("mixed", ts, 10, 1000);
    expect(reqs.every((r) => refs.has(r.targetUtxoRef))).toBe(true);
  });

  it("no tickets → empty rush", () => {
    expect(generateClaimRush("heavy", [], 24, 1000)).toHaveLength(0);
  });

  it("is deterministic", () => {
    const a = generateClaimRush("heavy", tickets(12), 10, 1000);
    const b = generateClaimRush("heavy", tickets(12), 10, 1000);
    expect(a).toEqual(b);
  });
});
