import { describe, expect, it } from 'vitest';
import { buildComponent, buildRisk } from '@compass/testing';
import { toReleaseId } from '@compass/domain';
import type { BreakingChangeImpactReport } from '@compass/application';
import { renderBreakingChangeReportMarkdown } from '../src/breaking-change-report.js';

describe('renderBreakingChangeReportMarkdown', () => {
  it('renders "_None._" placeholders when nothing changed and there are no known dependents', () => {
    const component = buildComponent({ name: 'midnight-js' });
    const report: BreakingChangeImpactReport = {
      componentId: component.id,
      fromReleaseId: toReleaseId('release-1'),
      toReleaseId: toReleaseId('release-2'),
      addedCapabilities: [],
      removedCapabilities: [],
      changedConstraints: [],
      affectedComponentIds: [],
      risk: null,
    };

    const markdown = renderBreakingChangeReportMarkdown(report, [component]);
    expect(markdown).toContain('### Breaking Change Report: midnight-js');
    expect(markdown).toContain('Comparing `release-1` → `release-2`');
    expect(markdown.match(/_None\./g)?.length).toBe(3);
    expect(markdown).toContain('_None known._');
    expect(markdown).toContain('**Risk:** _Not computed — no known dependents to evaluate._');
  });

  it('renders every populated section and the risk line', () => {
    const subject = buildComponent({ name: 'compact' });
    const target = buildComponent({ name: 'midnight-js' });
    const risk = buildRisk({ level: 'high' });
    const report: BreakingChangeImpactReport = {
      componentId: subject.id,
      fromReleaseId: toReleaseId('release-1'),
      toReleaseId: toReleaseId('release-2'),
      addedCapabilities: ['zk-proof-v2'],
      removedCapabilities: [
        {
          componentId: subject.id,
          fromReleaseId: toReleaseId('release-1'),
          toReleaseId: toReleaseId('release-2'),
          affectedCapability: 'legacy-witness',
          description: 'capability legacy-witness was removed',
        },
      ],
      changedConstraints: [
        {
          targetComponentId: target.id,
          from: { kind: 'version-range', range: '>=1.0.0' },
          to: { kind: 'version-range', range: '>=2.0.0' },
        },
        { targetComponentId: target.id, from: null, to: { kind: 'version-range', range: '>=1.0.0' } },
      ],
      affectedComponentIds: [target.id],
      risk,
    };

    const markdown = renderBreakingChangeReportMarkdown(report, [subject, target]);
    expect(markdown).toContain('- zk-proof-v2');
    expect(markdown).toContain('- `legacy-witness` — capability legacy-witness was removed');
    expect(markdown).toContain('- **midnight-js**: `>=1.0.0` → `>=2.0.0`');
    expect(markdown).toContain('- **midnight-js**: `_(none)_` → `>=1.0.0`');
    expect(markdown).toContain('- midnight-js');
    expect(markdown).toContain(`**Risk:** 🔴 High (${risk.contributingFactors.length} contributing factor(s))`);
  });
});
