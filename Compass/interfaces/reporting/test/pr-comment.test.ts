import { describe, expect, it } from 'vitest';
import { buildComponent, buildRisk } from '@compass/testing';
import type { CompatibilityMatrix } from '@compass/domain';
import { PR_COMMENT_MARKER, renderPrComment } from '../src/pr-comment.js';

describe('renderPrComment', () => {
  it('starts with the stable marker so the Action can find and update its own comment', () => {
    const matrix: CompatibilityMatrix = { componentIds: [], cells: [] };
    const result = renderPrComment({ components: [], matrix, risks: [], generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(result.markdown.startsWith(PR_COMMENT_MARKER)).toBe(true);
  });

  it('reports no incompatibility and a clean status line when the matrix has no cells', () => {
    const matrix: CompatibilityMatrix = { componentIds: [], cells: [] };
    const result = renderPrComment({ components: [], matrix, risks: [], generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(result.hasIncompatibility).toBe(false);
    expect(result.markdown).toContain('✅ **No known incompatibilities.**');
  });

  it('flags hasIncompatibility and shows the incompatible status line when any cell is incompatible', () => {
    const a = buildComponent();
    const b = buildComponent();
    const matrix: CompatibilityMatrix = {
      componentIds: [a.id, b.id],
      cells: [{ componentAId: a.id, componentBId: b.id, status: 'incompatible', relationshipIds: [] }],
    };
    const result = renderPrComment({ components: [a, b], matrix, risks: [], generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(result.hasIncompatibility).toBe(true);
    expect(result.markdown).toContain('❌ **Incompatibilities found**');
  });

  it('shows the unverified-only status line when nothing is incompatible but something is unverified', () => {
    const a = buildComponent();
    const b = buildComponent();
    const matrix: CompatibilityMatrix = {
      componentIds: [a.id, b.id],
      cells: [{ componentAId: a.id, componentBId: b.id, status: 'unverified', relationshipIds: [] }],
    };
    const result = renderPrComment({ components: [a, b], matrix, risks: [], generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(result.hasIncompatibility).toBe(false);
    expect(result.markdown).toContain('❓ **No incompatibilities found**, but some relationships are unverified.');
  });

  it('renders a risk line per risk, or a placeholder when there are none', () => {
    const matrix: CompatibilityMatrix = { componentIds: [], cells: [] };
    const withRisks = renderPrComment({
      components: [],
      matrix,
      risks: [buildRisk({ level: 'medium' })],
      generatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(withRisks.markdown).toContain('🟡');

    const withoutRisks = renderPrComment({ components: [], matrix, risks: [], generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(withoutRisks.markdown).toContain('_No components currently have relationships or breaking changes to assess._');
  });
});
