/**
 * Conflict Detector — builds the contention graph from the CURRENT request queue.
 * Pure function, no chain access. MVP rule: two requests conflict iff they target the same UTXO.
 */

import type { UserRequest, ContentionGraph } from "./types";

/** Pluggable conflict rule — swap this to extend to DEX/shared-state later. */
export function conflicts(a: UserRequest, b: UserRequest): boolean {
  return a.targetUtxoRef === b.targetUtxoRef;
}

export function buildContentionGraph(requests: UserRequest[]): ContentionGraph {
  const nodes = requests.map((r) => r.id);
  const edges: Array<[string, string]> = [];

  // Group by target for O(n) common case instead of O(n^2) pairwise.
  const groups = new Map<string, UserRequest[]>();
  for (const r of requests) {
    const g = groups.get(r.targetUtxoRef) ?? [];
    g.push(r);
    groups.set(r.targetUtxoRef, g);
  }
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i++)
      for (let j = i + 1; j < group.length; j++)
        edges.push([group[i].id, group[j].id]);
  }

  const adjacency = new Map<string, Set<string>>();
  for (const id of nodes) adjacency.set(id, new Set());
  for (const [a, b] of edges) {
    adjacency.get(a)!.add(b);
    adjacency.get(b)!.add(a);
  }

  return { nodes, edges, adjacency };
}
