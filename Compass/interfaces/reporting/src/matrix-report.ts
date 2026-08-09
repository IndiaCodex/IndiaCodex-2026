/**
 * The Compatibility Matrix Generator: renders the pure `CompatibilityMatrix`
 * view (docs/architecture/ecosystem-analysis-algorithms.md#compatibility-matrix)
 * as Markdown or HTML. No evaluation happens here — `buildCompatibilityMatrixView`
 * already did that; this only formats its output.
 */
import { componentName, escapeHtml, statusEmoji, statusLabel } from './format-helpers.js';
import type { Component } from '@compass/domain';
import type { CompatibilityMatrix, CompatibilityMatrixCell } from '@compass/domain';

function sortedCells(matrix: CompatibilityMatrix, components: readonly Component[]): readonly CompatibilityMatrixCell[] {
  return [...matrix.cells].sort((a, b) => {
    const fromCompare = componentName(components, a.componentAId).localeCompare(componentName(components, b.componentAId));
    if (fromCompare !== 0) return fromCompare;
    return componentName(components, a.componentBId).localeCompare(componentName(components, b.componentBId));
  });
}

export function renderCompatibilityMatrixMarkdown(matrix: CompatibilityMatrix, components: readonly Component[]): string {
  if (matrix.cells.length === 0) {
    return '_No known compatibility relationships in this snapshot yet._';
  }

  const rows = sortedCells(matrix, components).map((cell) => {
    const from = componentName(components, cell.componentAId);
    const to = componentName(components, cell.componentBId);
    return `| ${from} | ${to} | ${statusEmoji(cell.status)} ${statusLabel(cell.status)} | ${cell.relationshipIds.length} |`;
  });

  return [
    '| Component | Depends on | Status | Relationships |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

export function renderCompatibilityMatrixHtml(matrix: CompatibilityMatrix, components: readonly Component[]): string {
  if (matrix.cells.length === 0) {
    return '<p class="empty">No known compatibility relationships in this snapshot yet.</p>';
  }

  const rows = sortedCells(matrix, components)
    .map((cell) => {
      const from = escapeHtml(componentName(components, cell.componentAId));
      const to = escapeHtml(componentName(components, cell.componentBId));
      return (
        `<tr class="status-${cell.status}">` +
        `<td>${from}</td><td>${to}</td>` +
        `<td>${statusEmoji(cell.status)} ${statusLabel(cell.status)}</td>` +
        `<td>${cell.relationshipIds.length}</td>` +
        `</tr>`
      );
    })
    .join('\n');

  return (
    '<table class="compatibility-matrix">\n' +
    '<thead><tr><th>Component</th><th>Depends on</th><th>Status</th><th>Relationships</th></tr></thead>\n' +
    `<tbody>\n${rows}\n</tbody>\n` +
    '</table>'
  );
}
