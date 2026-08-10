import { describe, it, expect } from "vitest";
import { buildContentionGraph, conflicts } from "./conflictDetector";
import type { UserRequest } from "./types";

function req(id: string, target: string): UserRequest {
  return { id, kind: "claim", targetUtxoRef: target, claimant: id, ts: 0 };
}

describe("conflicts predicate", () => {
  it("two requests conflict iff they target the same UTXO", () => {
    expect(conflicts(req("a", "t1"), req("b", "t1"))).toBe(true);
    expect(conflicts(req("a", "t1"), req("b", "t2"))).toBe(false);
  });
});

describe("buildContentionGraph", () => {
  it("no-conflict: all distinct targets → zero edges", () => {
    const g = buildContentionGraph([req("a", "t1"), req("b", "t2"), req("c", "t3")]);
    expect(g.nodes).toHaveLength(3);
    expect(g.edges).toHaveLength(0);
    for (const id of g.nodes) expect(g.adjacency.get(id)!.size).toBe(0);
  });

  it("all-conflict: same target → complete graph (n*(n-1)/2 edges)", () => {
    const n = 4;
    const reqs = Array.from({ length: n }, (_, i) => req(`r${i}`, "t1"));
    const g = buildContentionGraph(reqs);
    expect(g.edges).toHaveLength((n * (n - 1)) / 2);
    // every node conflicts with the other n-1
    for (const id of g.nodes) expect(g.adjacency.get(id)!.size).toBe(n - 1);
  });

  it("mixed: only same-target requests are connected", () => {
    const g = buildContentionGraph([
      req("a", "t1"),
      req("b", "t1"),
      req("c", "t2"),
    ]);
    expect(g.edges).toHaveLength(1); // a–b only
    expect(g.adjacency.get("a")!.has("b")).toBe(true);
    expect(g.adjacency.get("c")!.size).toBe(0);
  });

  it("adjacency is symmetric", () => {
    const g = buildContentionGraph([req("a", "t1"), req("b", "t1")]);
    expect(g.adjacency.get("a")!.has("b")).toBe(true);
    expect(g.adjacency.get("b")!.has("a")).toBe(true);
  });

  it("empty input → empty graph", () => {
    const g = buildContentionGraph([]);
    expect(g.nodes).toHaveLength(0);
    expect(g.edges).toHaveLength(0);
  });
});
