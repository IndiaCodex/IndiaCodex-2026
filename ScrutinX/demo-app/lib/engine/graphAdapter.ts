/**
 * Adapts our ContentionGraph into the shape react-force-graph-2d wants,
 * flagging which nodes are in the chosen batch (MIS) so the viz can highlight them.
 * Isolating the viz-lib shape here means swapping graph libraries is a one-file change.
 */

import type { ContentionGraph, Batch, UserRequest } from "@/lib/agent/types";

export interface GraphNode {
  id: string;
  label: string; // short target ticket, for display
  chosen: boolean; // in the selected MIS this cycle
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface ForceGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function toForceGraph(
  graph: ContentionGraph | null,
  batch: Batch | null,
  requests: UserRequest[]
): ForceGraphData {
  if (!graph) return { nodes: [], links: [] };
  const chosen = new Set((batch?.requests ?? []).map((r) => r.id));
  const label = new Map(requests.map((r) => [r.id, r.targetUtxoRef.split("#")[0]]));

  return {
    nodes: graph.nodes.map((id) => ({
      id,
      label: label.get(id) ?? id,
      chosen: chosen.has(id),
    })),
    links: graph.edges.map(([source, target]) => ({ source, target })),
  };
}
