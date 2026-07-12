"use client";

import { useMemo } from "react";
import { useBatcherStore } from "@/stores/useBatcherStore";
import { toForceGraph } from "@/lib/engine/graphAdapter";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Self-contained SVG contention graph (no external lib → no fragile dynamic chunk).
// Deterministic circular layout: nodes on a ring, conflict edges as chords, chosen MIS highlighted.
const W = 560;
const H = 300;
const CX = W / 2;
const CY = H / 2;
const R = Math.min(W, H) / 2 - 28;

export function ContentionGraph() {
  const graph = useBatcherStore((s) => s.graph);
  const batch = useBatcherStore((s) => s.currentBatch);
  const queue = useBatcherStore((s) => s.queue);

  const data = useMemo(
    () => toForceGraph(graph, batch, [...queue, ...(batch?.requests ?? [])]),
    [graph, batch, queue]
  );

  const pos = useMemo(() => {
    const m = new Map<string, [number, number]>();
    const n = data.nodes.length || 1;
    data.nodes.forEach((node, i) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      m.set(node.id, [CX + R * Math.cos(a), CY + R * Math.sin(a)]);
    });
    return m;
  }, [data]);

  const chosenCount = data.nodes.filter((n) => n.chosen).length;

  return (
    <Card
      title="Contention graph"
      right={
        <div className="flex items-center gap-2">
          <Badge tone="success">● chosen (batch)</Badge>
          <Badge tone="danger">— conflict</Badge>
        </div>
      }
    >
      <div className="h-[300px] w-full overflow-hidden rounded-lg bg-surface2">
        {data.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Fire a load preset to see conflicts.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* conflict edges */}
            <g stroke="rgba(248,113,113,0.45)" strokeWidth={1.25}>
              {data.links.map((l, i) => {
                const a = pos.get(l.source);
                const b = pos.get(l.target);
                if (!a || !b) return null;
                return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
              })}
            </g>
            {/* nodes */}
            <g>
              {data.nodes.map((node) => {
                const p = pos.get(node.id);
                if (!p) return null;
                return (
                  <circle
                    key={node.id}
                    cx={p[0]}
                    cy={p[1]}
                    r={node.chosen ? 7 : 5}
                    fill={node.chosen ? "#34d399" : "#8592b0"}
                    stroke={node.chosen ? "#0b0f1a" : "none"}
                    strokeWidth={node.chosen ? 2 : 0}
                  >
                    <title>{node.label}</title>
                  </circle>
                );
              })}
            </g>
          </svg>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        {data.nodes.length} requests · {data.links.length} conflicts ·{" "}
        <span className="text-success">{chosenCount} selected</span> (max independent set)
      </p>
    </Card>
  );
}
