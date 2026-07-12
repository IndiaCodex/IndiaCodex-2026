import { describe, it, expect } from "vitest";
import { selectBatch } from "./optimizer";
import { buildContentionGraph } from "./conflictDetector";
import type { UserRequest } from "./types";

function req(id: string, target: string): UserRequest {
  return { id, kind: "claim", targetUtxoRef: target, claimant: id, ts: 0 };
}

/** A batch is valid iff no two chosen requests share a conflict edge. */
function isConflictFree(chosen: UserRequest[]): boolean {
  const targets = chosen.map((r) => r.targetUtxoRef);
  return new Set(targets).size === targets.length;
}

describe("selectBatch (greedy MIS)", () => {
  it("no-conflict: selects all requests (up to cap)", () => {
    const reqs = [req("a", "t1"), req("b", "t2"), req("c", "t3")];
    const g = buildContentionGraph(reqs);
    const batch = selectBatch(reqs, g, 0.4, 10);
    expect(batch.requests).toHaveLength(3);
    expect(isConflictFree(batch.requests)).toBe(true);
  });

  it("all-conflict: selects exactly one", () => {
    const reqs = Array.from({ length: 5 }, (_, i) => req(`r${i}`, "t1"));
    const g = buildContentionGraph(reqs);
    const batch = selectBatch(reqs, g, 0.4, 10);
    expect(batch.requests).toHaveLength(1);
  });

  it("respects the cap", () => {
    const reqs = Array.from({ length: 8 }, (_, i) => req(`r${i}`, `t${i}`));
    const g = buildContentionGraph(reqs);
    const batch = selectBatch(reqs, g, 0.4, 3);
    expect(batch.requests.length).toBeLessThanOrEqual(3);
    expect(isConflictFree(batch.requests)).toBe(true);
  });

  it("chosen set is always conflict-free on a mixed graph", () => {
    // t1: a,b,c  | t2: d,e | t3: f  → MIS should pick at most one per target
    const reqs = [
      req("a", "t1"),
      req("b", "t1"),
      req("c", "t1"),
      req("d", "t2"),
      req("e", "t2"),
      req("f", "t3"),
    ];
    const g = buildContentionGraph(reqs);
    const batch = selectBatch(reqs, g, 0.4, 10);
    expect(isConflictFree(batch.requests)).toBe(true);
    // one per distinct target = 3
    expect(batch.requests).toHaveLength(3);
  });

  it("records the congestion score it was built at", () => {
    const reqs = [req("a", "t1")];
    const g = buildContentionGraph(reqs);
    const batch = selectBatch(reqs, g, 0.73, 10);
    expect(batch.builtAtScore).toBe(0.73);
  });

  it("empty input → empty batch", () => {
    const g = buildContentionGraph([]);
    const batch = selectBatch([], g, 0.4, 10);
    expect(batch.requests).toHaveLength(0);
  });
});
