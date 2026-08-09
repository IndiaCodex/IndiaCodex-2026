import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { versionRange } from '../src/constraint.js';
import { evaluateCompatibility } from '../src/compatibility-engine.js';
import { createEvidence } from '../src/evidence.js';
import { semVerScheme } from '../src/version.js';
import {
  toCompatibilityRelationshipId,
  toCompatibilityRuleId,
  toEvidenceId,
  toRulePackId,
  toSnapshotId,
  toTimestamp,
} from '../src/ids.js';
import { component, release } from './fixtures.js';
import type { CompatibilityRule } from '../src/compatibility-rule.js';
import type { Evidence } from '../src/evidence.js';
import type { ReleaseId } from '../src/ids.js';

const RULE_PACK = toRulePackId('pack-1');
const NOW = toTimestamp('2026-01-01T00:00:00.000Z');
const SNAPSHOT = toSnapshotId('snap-1');

const sdk = component('sdk-a', 'sdk');
const runtime = component('runtime-a', 'runtime');
const sdkRelease = release({ id: 'sdk-1.0', componentId: 'sdk-a', version: '1.0.0' });
const runtimeRelease = release({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' });

function rule(id: string, range: string, conclusion: CompatibilityRule['conclusion']): CompatibilityRule {
  return {
    id: toCompatibilityRuleId(id),
    description: `rule ${id}`,
    appliesTo: { componentTypeA: null, componentTypeB: null },
    condition: versionRange(range),
    conclusion,
    rulePackId: RULE_PACK,
  };
}

function releaseEvidence(id: string, releaseId: ReleaseId): Evidence {
  return createEvidence({
    id: toEvidenceId(id),
    subject: { kind: 'release', id: releaseId },
    sourceType: 'declared-metadata',
    producedBy: 'test-fixture',
    payload: {},
    collectedAt: NOW,
    snapshotId: SNAPSHOT,
  });
}

const fullEvidence = [releaseEvidence('e-sdk', sdkRelease.id), releaseEvidence('e-runtime', runtimeRelease.id)];

describe('evaluateCompatibility', () => {
  it('resolves to "unverified" when no rule fires, even with evidence present', () => {
    const result = evaluateCompatibility({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      dependency: null,
      rules: [rule('r1', '>=5.0.0', 'compatible')], // runtime is 2.0.0, does not satisfy
      evidence: fullEvidence,
      versionScheme: semVerScheme,
    });
    expect(result.status).toBe('unverified');
  });

  it('resolves to "unverified" when a rule fires but there is no relevant evidence (fail-closed)', () => {
    const result = evaluateCompatibility({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      dependency: null,
      rules: [rule('r1', '>=1.0.0', 'compatible')],
      evidence: [], // no evidence at all
      versionScheme: semVerScheme,
    });
    expect(result.status).toBe('unverified');
    expect(result.evidenceIds).toEqual([]);
  });

  it('resolves to "compatible" when a compatible rule fires and evidence is present', () => {
    const result = evaluateCompatibility({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      dependency: null,
      rules: [rule('r1', '>=1.0.0', 'compatible')],
      evidence: fullEvidence,
      versionScheme: semVerScheme,
    });
    expect(result.status).toBe('compatible');
    expect(result.evidenceIds).toHaveLength(2);
  });

  it('resolves to "incompatible" when any fired rule concludes incompatible, regardless of other compatible rules', () => {
    const result = evaluateCompatibility({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      dependency: null,
      rules: [rule('compatible-rule', '>=1.0.0', 'compatible'), rule('incompatible-rule', '>=2.0.0', 'incompatible')],
      evidence: fullEvidence,
      versionScheme: semVerScheme,
    });
    expect(result.status).toBe('incompatible');
  });

  it('treats "requires-constraint" as compatible for status purposes', () => {
    const result = evaluateCompatibility({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      dependency: null,
      rules: [rule('r1', '>=1.0.0', 'requires-constraint')],
      evidence: fullEvidence,
      versionScheme: semVerScheme,
    });
    expect(result.status).toBe('compatible');
  });

  it('is order-independent: shuffling the rule list never changes the resolved status', () => {
    const rules = [
      rule('compatible-1', '>=1.0.0', 'compatible'),
      rule('incompatible-1', '>=2.0.0', 'incompatible'),
      rule('compatible-2', '>=1.5.0', 'compatible'),
    ];

    fc.assert(
      fc.property(fc.shuffledSubarray(rules, { minLength: rules.length }), (shuffled) => {
        const result = evaluateCompatibility({
          releaseA: sdkRelease,
          componentA: sdk,
          releaseB: runtimeRelease,
          componentB: runtime,
          dependency: null,
          rules: shuffled,
          evidence: fullEvidence,
          versionScheme: semVerScheme,
        });
        expect(result.status).toBe('incompatible');
      }),
    );
  });

  it('is deterministic: evaluating the same input twice yields the same status and evidence set', () => {
    const input = {
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      dependency: null,
      rules: [rule('r1', '>=1.0.0', 'compatible')],
      evidence: fullEvidence,
      versionScheme: semVerScheme,
    };
    const first = evaluateCompatibility(input);
    const second = evaluateCompatibility(input);
    expect(first.status).toBe(second.status);
    expect(first.evidenceIds).toEqual(second.evidenceIds);
  });

  it('treats dependency-subject evidence naming this exact releaseA/componentB pair as relevant', () => {
    const dependencyEvidence = createEvidence({
      id: toEvidenceId('e-dep'),
      subject: { kind: 'dependency', releaseId: sdkRelease.id, targetComponentId: runtime.id },
      sourceType: 'declared-metadata',
      producedBy: 'test-fixture',
      payload: {},
      collectedAt: NOW,
      snapshotId: SNAPSHOT,
    });
    const result = evaluateCompatibility({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      dependency: null,
      rules: [rule('r1', '>=1.0.0', 'compatible')],
      evidence: [dependencyEvidence],
      versionScheme: semVerScheme,
    });
    expect(result.status).toBe('compatible');
    expect(result.evidenceIds).toEqual([dependencyEvidence.id]);
  });

  it('ignores dependency-subject evidence for a different target component', () => {
    const otherComponent = component('some-other-component');
    const dependencyEvidence = createEvidence({
      id: toEvidenceId('e-dep'),
      subject: { kind: 'dependency', releaseId: sdkRelease.id, targetComponentId: otherComponent.id },
      sourceType: 'declared-metadata',
      producedBy: 'test-fixture',
      payload: {},
      collectedAt: NOW,
      snapshotId: SNAPSHOT,
    });
    const result = evaluateCompatibility({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      dependency: null,
      rules: [rule('r1', '>=1.0.0', 'compatible')],
      evidence: [dependencyEvidence],
      versionScheme: semVerScheme,
    });
    expect(result.status).toBe('unverified');
  });

  it('ignores evidence whose subject is a compatibility-relationship, not a release or dependency', () => {
    const relationshipEvidence = createEvidence({
      id: toEvidenceId('e-rel'),
      subject: { kind: 'compatibility-relationship', id: toCompatibilityRelationshipId('some-other-relationship') },
      sourceType: 'declared-metadata',
      producedBy: 'test-fixture',
      payload: {},
      collectedAt: NOW,
      snapshotId: SNAPSHOT,
    });
    const result = evaluateCompatibility({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      dependency: null,
      rules: [rule('r1', '>=1.0.0', 'compatible')],
      evidence: [relationshipEvidence],
      versionScheme: semVerScheme,
    });
    expect(result.status).toBe('unverified');
  });

  it('ignores evidence about unrelated releases', () => {
    const unrelatedEvidence = releaseEvidence('e-unrelated', release({ id: 'other', componentId: 'other-c', version: '1.0.0' }).id);
    const result = evaluateCompatibility({
      releaseA: sdkRelease,
      componentA: sdk,
      releaseB: runtimeRelease,
      componentB: runtime,
      dependency: null,
      rules: [rule('r1', '>=1.0.0', 'compatible')],
      evidence: [unrelatedEvidence],
      versionScheme: semVerScheme,
    });
    expect(result.status).toBe('unverified');
  });

  describe('declared Dependency constraint (ADR 0011)', () => {
    const dependencyEvidence = createEvidence({
      id: toEvidenceId('e-dep-declared'),
      subject: { kind: 'dependency', releaseId: sdkRelease.id, targetComponentId: runtime.id },
      sourceType: 'declared-metadata',
      producedBy: 'test-fixture',
      payload: {},
      collectedAt: NOW,
      snapshotId: SNAPSHOT,
    });

    it('resolves to "compatible" when the target release satisfies the declared dependency constraint, with zero rules', () => {
      const result = evaluateCompatibility({
        releaseA: sdkRelease,
        componentA: sdk,
        releaseB: runtimeRelease, // 2.0.0
        componentB: runtime,
        dependency: { targetComponentId: runtime.id, constraint: versionRange('>=2.0.0'), kind: 'required' },
        rules: [],
        evidence: [dependencyEvidence],
        versionScheme: semVerScheme,
      });
      expect(result.status).toBe('compatible');
      expect(result.dependencySatisfied).toBe(true);
    });

    it('resolves to "incompatible" when the target release violates the declared dependency constraint, with zero rules', () => {
      const result = evaluateCompatibility({
        releaseA: sdkRelease,
        componentA: sdk,
        releaseB: runtimeRelease, // 2.0.0
        componentB: runtime,
        dependency: { targetComponentId: runtime.id, constraint: versionRange('>=3.0.0'), kind: 'required' },
        rules: [],
        evidence: [dependencyEvidence],
        versionScheme: semVerScheme,
      });
      expect(result.status).toBe('incompatible');
      expect(result.dependencySatisfied).toBe(false);
    });

    it('an unsatisfied dependency constraint wins over an otherwise-compatible rule', () => {
      const result = evaluateCompatibility({
        releaseA: sdkRelease,
        componentA: sdk,
        releaseB: runtimeRelease,
        componentB: runtime,
        dependency: { targetComponentId: runtime.id, constraint: versionRange('>=3.0.0'), kind: 'required' },
        rules: [rule('r1', '>=1.0.0', 'compatible')],
        evidence: [dependencyEvidence],
        versionScheme: semVerScheme,
      });
      expect(result.status).toBe('incompatible');
    });

    it('dependencySatisfied is null when no Dependency was supplied', () => {
      const result = evaluateCompatibility({
        releaseA: sdkRelease,
        componentA: sdk,
        releaseB: runtimeRelease,
        componentB: runtime,
        dependency: null,
        rules: [rule('r1', '>=1.0.0', 'compatible')],
        evidence: fullEvidence,
        versionScheme: semVerScheme,
      });
      expect(result.dependencySatisfied).toBeNull();
    });

    it('stays "unverified" when a dependency is supplied but there is no relevant evidence (fail-closed)', () => {
      const result = evaluateCompatibility({
        releaseA: sdkRelease,
        componentA: sdk,
        releaseB: runtimeRelease,
        componentB: runtime,
        dependency: { targetComponentId: runtime.id, constraint: versionRange('>=2.0.0'), kind: 'required' },
        rules: [],
        evidence: [],
        versionScheme: semVerScheme,
      });
      expect(result.status).toBe('unverified');
    });
  });
});
