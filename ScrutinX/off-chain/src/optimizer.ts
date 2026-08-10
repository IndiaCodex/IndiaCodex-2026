/**
 * Batch Optimizer — largest conflict-free set of requests (greedy Maximum Independent Set),
 * capped at the on-chain execution limit. Pure function, no chain access.
 *
 * Greedy min-degree: repeatedly take the request with the fewest remaining conflicts, then remove
 * it and its neighbours. Good enough for our small, sparse graphs; easy to explain to judges.
 */

import type { UserRequest, ContentionGraph, Batch } from "./types";

export function selectBatch(
  requests: UserRequest[],
  graph: ContentionGraph,
  score: number,
  cap: number
): Batch {
  const byId = new Map(requests.map((r) => [r.id, r]));
  const remaining = new Set(graph.nodes);
  const chosen: string[] = [];

  const degree = (id: string): number => {
    let d = 0;
    for (const nb of graph.adjacency.get(id) ?? []) if (remaining.has(nb)) d++;
    return d;
  };

  while (remaining.size > 0 && chosen.length < cap) {
    // pick min-degree node (fewest remaining conflicts)
    let best: string | null = null;
    let bestDeg = Infinity;
    for (const id of remaining) {
      const d = degree(id);
      if (d < bestDeg) {
        bestDeg = d;
        best = id;
      }
    }
    if (best === null) break;

    chosen.push(best);
    remaining.delete(best);
    for (const nb of graph.adjacency.get(best) ?? []) remaining.delete(nb); // neighbours conflict
  }

  return {
    requests: chosen.map((id) => byId.get(id)!),
    builtAtScore: score,
  };
}
