/**
 * The Dependency Graph Generator: renders a Snapshot's component-level
 * dependency edges as Mermaid — directly renderable in GitHub Markdown (PR
 * comments, this repository's own docs), with no client-side graphing
 * library required for the CLI/Action's Markdown output. The dashboard
 * (dashboard.ts) renders the same edges without Mermaid, for a
 * zero-dependency static HTML page — see that file for why.
 */
import { componentName } from './format-helpers.js';
import type { ComponentId, Snapshot } from '@compass/domain';

interface ComponentEdge {
  readonly fromId: ComponentId;
  readonly toId: ComponentId;
}

function collectComponentEdges(snapshot: Snapshot): readonly ComponentEdge[] {
  const seen = new Set<string>();
  const edges: ComponentEdge[] = [];
  for (const release of snapshot.releases) {
    for (const dependency of release.dependencies) {
      const key = `${release.componentId}->${dependency.targetComponentId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ fromId: release.componentId, toId: dependency.targetComponentId });
    }
  }
  return edges;
}

/** Mermaid node ids must be alphanumeric-ish; real component ids contain "/" and "-", so they're mapped to safe, stable synthetic ids. */
function mermaidNodeId(componentId: ComponentId, index: number): string {
  return `c${index}_${componentId.replace(/[^a-zA-Z0-9]/g, '_')}`.slice(0, 60);
}

export function renderDependencyGraphMermaid(snapshot: Snapshot): string {
  const edges = collectComponentEdges(snapshot);
  const componentIds = [...new Set([...snapshot.components.map((c) => c.id), ...edges.flatMap((e) => [e.fromId, e.toId])])].sort();
  const nodeIdByComponentId = new Map(componentIds.map((id, index) => [id, mermaidNodeId(id, index)]));

  const lines = ['graph LR'];
  for (const componentId of componentIds) {
    const nodeId = nodeIdByComponentId.get(componentId);
    const label = componentName(snapshot.components, componentId).replaceAll('"', "'");
    lines.push(`    ${nodeId}["${label}"]`);
  }
  for (const edge of edges) {
    const from = nodeIdByComponentId.get(edge.fromId);
    const to = nodeIdByComponentId.get(edge.toId);
    if (from && to) lines.push(`    ${from} --> ${to}`);
  }

  return lines.join('\n');
}

/** A plain-text fallback (terminal-friendly, no Mermaid needed) — "component -> depends on -> component" per line, sorted for determinism. */
export function renderDependencyGraphText(snapshot: Snapshot): string {
  const edges = collectComponentEdges(snapshot);
  if (edges.length === 0) return 'No declared dependencies in this snapshot.';

  return edges
    .map((edge) => `${componentName(snapshot.components, edge.fromId)} -> ${componentName(snapshot.components, edge.toId)}`)
    .sort()
    .join('\n');
}
