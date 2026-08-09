import { describe, expect, it } from 'vitest';
import { buildComponent, buildRecommendation, buildRisk } from '@compass/testing';
import { toCompatibilityRelationshipId, toReleaseId } from '@compass/domain';
import type { UpgradeEvaluation, UpgradeImpactAnalysis } from '@compass/application';
import { renderUpgradeEvaluationMarkdown, renderUpgradeImpactMarkdown } from '../src/upgrade-advisor-report.js';

describe('renderUpgradeEvaluationMarkdown', () => {
  it('renders the recommended action, target release, and risk', () => {
    const subject = buildComponent({ name: 'midnight-js' });
    const evaluation: UpgradeEvaluation = {
      recommendation: buildRecommendation({
        subjectComponentId: subject.id,
        action: 'upgrade',
        targetReleaseId: toReleaseId('release-2'),
        rationale: [{ kind: 'compatibility-relationship', id: toCompatibilityRelationshipId('relationship-1') }],
      }),
      risk: buildRisk({ level: 'low' }),
    };

    const markdown = renderUpgradeEvaluationMarkdown(evaluation, [subject]);
    expect(markdown).toContain('### Upgrade Advisor: midnight-js');
    expect(markdown).toContain('**Recommendation:** ✅ Upgrade');
    expect(markdown).toContain('**Target release:** `release-2`');
    expect(markdown).toContain('**Risk:** 🟢 Low');
    expect(markdown).toContain('**Rationale:** 1 citation(s)');
  });

  it('omits the target release line when the recommendation has none', () => {
    const subject = buildComponent();
    const evaluation: UpgradeEvaluation = {
      recommendation: buildRecommendation({ subjectComponentId: subject.id, action: 'hold', targetReleaseId: null }),
      risk: buildRisk(),
    };

    const markdown = renderUpgradeEvaluationMarkdown(evaluation, [subject]);
    expect(markdown).not.toContain('**Target release:**');
    expect(markdown).toContain('**Recommendation:** ⏸️ Hold');
  });
});

describe('renderUpgradeImpactMarkdown', () => {
  it('renders "_None._" for every empty category', () => {
    const analysis: UpgradeImpactAnalysis = {
      targetReleaseId: toReleaseId('release-2'),
      blockedComponents: [],
      compatibleComponentIds: [],
      unverifiedComponentIds: [],
    };

    const markdown = renderUpgradeImpactMarkdown(analysis, []);
    expect(markdown).toContain('### Upgrade Impact: moving to `release-2`');
    expect(markdown.match(/_None\./g)?.length).toBe(3);
  });

  it('lists blocked, compatible, and unverified components by name', () => {
    const blocked = buildComponent({ name: 'blocked-component' });
    const compatible = buildComponent({ name: 'compatible-component' });
    const unverified = buildComponent({ name: 'unverified-component' });
    const analysis: UpgradeImpactAnalysis = {
      targetReleaseId: toReleaseId('release-2'),
      blockedComponents: [
        {
          componentId: blocked.id,
          dependentReleaseId: toReleaseId('dependent-1'),
          declaredConstraint: { kind: 'version-range', range: '>=1.0.0' },
        },
      ],
      compatibleComponentIds: [compatible.id],
      unverifiedComponentIds: [unverified.id],
    };

    const markdown = renderUpgradeImpactMarkdown(analysis, [blocked, compatible, unverified]);
    expect(markdown).toContain('- blocked-component');
    expect(markdown).toContain('- compatible-component');
    expect(markdown).toContain('- unverified-component');
  });
});
