import { describe, expect, it } from 'vitest';
import { buildComponent, buildRelease, buildRisk, buildSnapshot } from '@compass/testing';
import type { CompatibilityMatrix } from '@compass/domain';
import { renderDashboardHtml } from '../src/dashboard.js';

describe('renderDashboardHtml', () => {
  it('renders a complete, self-contained HTML document', () => {
    const component = buildComponent({ name: 'midnight-js' });
    const release = buildRelease({ componentId: component.id });
    const snapshot = buildSnapshot({ components: [component], releases: [release] });
    const matrix: CompatibilityMatrix = { componentIds: [], cells: [] };

    const html = renderDashboardHtml({ snapshot, matrix, risks: [], generatedAt: '2026-01-01T00:00:00.000Z' });

    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<title>Compass — Ecosystem Dashboard</title>');
    expect(html).toContain(`Snapshot <code>${snapshot.id}</code>`);
    expect(html).not.toContain('<script');
  });

  it('renders a risk card per risk and a placeholder when there are none', () => {
    const snapshot = buildSnapshot();
    const matrix: CompatibilityMatrix = { componentIds: [], cells: [] };

    const empty = renderDashboardHtml({ snapshot, matrix, risks: [], generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(empty).toContain('No risk data yet');

    const withRisk = renderDashboardHtml({
      snapshot,
      matrix,
      risks: [buildRisk({ level: 'high' })],
      generatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(withRisk).toContain('class="card"');
    expect(withRisk).toContain('🔴 High');
  });

  it('lists each tracked component with its release count', () => {
    const component = buildComponent({ name: 'compact', type: 'toolchain' });
    const release = buildRelease({ componentId: component.id });
    const snapshot = buildSnapshot({ components: [component], releases: [release] });
    const matrix: CompatibilityMatrix = { componentIds: [], cells: [] };

    const html = renderDashboardHtml({ snapshot, matrix, risks: [], generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(html).toContain('<td>compact</td><td>toolchain</td><td>1</td>');
  });

  it('escapes component names to prevent HTML injection', () => {
    const component = buildComponent({ name: '<img src=x onerror=alert(1)>' });
    const snapshot = buildSnapshot({ components: [component], releases: [] });
    const matrix: CompatibilityMatrix = { componentIds: [], cells: [] };

    const html = renderDashboardHtml({ snapshot, matrix, risks: [], generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
