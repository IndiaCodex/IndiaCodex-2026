import { describe, expect, it } from 'vitest';
import { buildComponent } from '@compass/testing';
import { toCompatibilityRelationshipId } from '@compass/domain';
import type { CompatibilityMatrix } from '@compass/domain';
import { renderCompatibilityMatrixHtml, renderCompatibilityMatrixMarkdown } from '../src/matrix-report.js';

describe('renderCompatibilityMatrixMarkdown', () => {
  it('renders an empty matrix as a plain message, not an empty table', () => {
    const matrix: CompatibilityMatrix = { componentIds: [], cells: [] };
    expect(renderCompatibilityMatrixMarkdown(matrix, [])).toBe(
      '_No known compatibility relationships in this snapshot yet._',
    );
  });

  it('renders one row per cell, sorted by component name', () => {
    const a = buildComponent({ name: 'zeta' });
    const b = buildComponent({ name: 'alpha' });
    const matrix: CompatibilityMatrix = {
      componentIds: [a.id, b.id],
      cells: [
        {
          componentAId: a.id,
          componentBId: b.id,
          status: 'incompatible',
          relationshipIds: [toCompatibilityRelationshipId('r-1'), toCompatibilityRelationshipId('r-2')],
        },
      ],
    };

    const markdown = renderCompatibilityMatrixMarkdown(matrix, [a, b]);
    expect(markdown).toContain('| Component | Depends on | Status | Relationships |');
    expect(markdown).toContain('| zeta | alpha | ❌ Incompatible | 2 |');
  });

  it('sorts multiple rows by "depends on" name when the "component" name ties', () => {
    const a = buildComponent({ name: 'shared' });
    const b = buildComponent({ name: 'zeta' });
    const c = buildComponent({ name: 'alpha' });
    const matrix: CompatibilityMatrix = {
      componentIds: [a.id, b.id, c.id],
      cells: [
        { componentAId: a.id, componentBId: b.id, status: 'compatible', relationshipIds: [] },
        { componentAId: a.id, componentBId: c.id, status: 'compatible', relationshipIds: [] },
      ],
    };

    const markdown = renderCompatibilityMatrixMarkdown(matrix, [a, b, c]);
    const alphaRow = markdown.indexOf('| shared | alpha |');
    const zetaRow = markdown.indexOf('| shared | zeta |');
    expect(alphaRow).toBeGreaterThan(-1);
    expect(zetaRow).toBeGreaterThan(alphaRow);
  });

  it('falls back to the raw id for a component missing from the given list', () => {
    const a = buildComponent();
    const b = buildComponent();
    const matrix: CompatibilityMatrix = {
      componentIds: [a.id, b.id],
      cells: [{ componentAId: a.id, componentBId: b.id, status: 'unverified', relationshipIds: [] }],
    };

    const markdown = renderCompatibilityMatrixMarkdown(matrix, []);
    expect(markdown).toContain(`| ${a.id} | ${b.id} | ❓ Unverified | 0 |`);
  });
});

describe('renderCompatibilityMatrixHtml', () => {
  it('renders an empty matrix as a plain message', () => {
    const matrix: CompatibilityMatrix = { componentIds: [], cells: [] };
    expect(renderCompatibilityMatrixHtml(matrix, [])).toBe(
      '<p class="empty">No known compatibility relationships in this snapshot yet.</p>',
    );
  });

  it('renders a table row per cell with an escaped, status-scoped class', () => {
    const a = buildComponent({ name: '<a>' });
    const b = buildComponent({ name: 'b' });
    const matrix: CompatibilityMatrix = {
      componentIds: [a.id, b.id],
      cells: [{ componentAId: a.id, componentBId: b.id, status: 'compatible', relationshipIds: [] }],
    };

    const html = renderCompatibilityMatrixHtml(matrix, [a, b]);
    expect(html).toContain('<table class="compatibility-matrix">');
    expect(html).toContain('<tr class="status-compatible">');
    expect(html).toContain('&lt;a&gt;');
    expect(html).not.toContain('<a>');
  });
});
