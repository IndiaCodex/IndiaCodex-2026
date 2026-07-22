import { describe, expect, it } from 'vitest';
import { buildComponent, buildDependency, buildRelease, buildSnapshot } from '@compass/testing';
import { toComponentId } from '@compass/domain';
import { renderDependencyGraphMermaid, renderDependencyGraphText } from '../src/dependency-graph.js';

describe('renderDependencyGraphMermaid', () => {
  it('renders a node per component and an edge per unique dependency', () => {
    const from = buildComponent({ name: 'midnight-js' });
    const to = buildComponent({ name: 'compact' });
    const release = buildRelease({
      componentId: from.id,
      dependencies: [buildDependency({ targetComponentId: to.id })],
    });
    const snapshot = buildSnapshot({ components: [from, to], releases: [release] });

    const mermaid = renderDependencyGraphMermaid(snapshot);
    expect(mermaid.startsWith('graph LR')).toBe(true);
    expect(mermaid).toContain('["midnight-js"]');
    expect(mermaid).toContain('["compact"]');
    expect(mermaid).toMatch(/-->/);
  });

  it('deduplicates repeated dependency edges', () => {
    const from = buildComponent();
    const to = buildComponent();
    const releaseA = buildRelease({ componentId: from.id, dependencies: [buildDependency({ targetComponentId: to.id })] });
    const releaseB = buildRelease({ componentId: from.id, dependencies: [buildDependency({ targetComponentId: to.id })] });
    const snapshot = buildSnapshot({ components: [from, to], releases: [releaseA, releaseB] });

    const mermaid = renderDependencyGraphMermaid(snapshot);
    const arrowCount = mermaid.split('\n').filter((line) => line.includes('-->')).length;
    expect(arrowCount).toBe(1);
  });

  it('sanitizes component ids that contain characters unsafe for Mermaid node ids', () => {
    const component = buildComponent({ id: toComponentId('org/pkg-name') });
    const snapshot = buildSnapshot({ components: [component], releases: [] });

    const mermaid = renderDependencyGraphMermaid(snapshot);
    expect(mermaid).not.toContain('org/pkg-name[');
  });

  it('renders an empty graph with no edges when there are no components or releases', () => {
    const snapshot = buildSnapshot();
    expect(renderDependencyGraphMermaid(snapshot)).toBe('graph LR');
  });
});

describe('renderDependencyGraphText', () => {
  it('reports no declared dependencies for an empty snapshot', () => {
    const snapshot = buildSnapshot();
    expect(renderDependencyGraphText(snapshot)).toBe('No declared dependencies in this snapshot.');
  });

  it('renders one sorted "from -> to" line per unique edge', () => {
    const from = buildComponent({ name: 'midnight-js' });
    const to = buildComponent({ name: 'compact' });
    const release = buildRelease({
      componentId: from.id,
      dependencies: [buildDependency({ targetComponentId: to.id })],
    });
    const snapshot = buildSnapshot({ components: [from, to], releases: [release] });

    expect(renderDependencyGraphText(snapshot)).toBe('midnight-js -> compact');
  });
});
