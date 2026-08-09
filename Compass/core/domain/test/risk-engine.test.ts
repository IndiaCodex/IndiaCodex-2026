import { describe, expect, it } from 'vitest';
import { UnsubstantiatedRiskError } from '../src/errors.js';
import { computeRisk } from '../src/risk-engine.js';
import { createBreakingChange } from '../src/breaking-change.js';
import { createCompatibilityRelationship } from '../src/compatibility-relationship.js';
import {
  toBreakingChangeId,
  toCompatibilityRelationshipId,
  toComponentId,
  toEvidenceId,
  toReleaseId,
  toRiskId,
  toSnapshotId,
} from '../src/ids.js';
import { release } from './fixtures.js';

const SNAPSHOT = toSnapshotId('snap-1');
const SCOPE = { kind: 'component' as const, componentId: toComponentId('sdk-a') };

function relationship(status: 'compatible' | 'incompatible' | 'unverified', id = `rel-${status}`) {
  return createCompatibilityRelationship({
    id: toCompatibilityRelationshipId(id),
    releaseAId: toReleaseId('release-a'),
    releaseBId: toReleaseId('release-b'),
    status,
    ruleIds: [],
    evidenceIds: status === 'unverified' ? [] : [toEvidenceId('e1')],
    snapshotId: SNAPSHOT,
  });
}

function breakingChange(id: string) {
  const fromRelease = release({ id: 'from', componentId: 'sdk-a', version: '1.0.0' });
  const toRelease = release({ id: 'to', componentId: 'sdk-a', version: '2.0.0' });
  return createBreakingChange({
    id: toBreakingChangeId(id),
    fromRelease,
    toRelease,
    affectedCapability: 'cap',
    description: 'test',
    detectedViaEvidenceId: toEvidenceId('e1'),
  });
}

describe('computeRisk', () => {
  it('is "high" when at least one relationship is incompatible', () => {
    const risk = computeRisk({
      id: toRiskId('risk-1'),
      scope: SCOPE,
      relationships: [relationship('incompatible')],
      breakingChanges: [],
      snapshotId: SNAPSHOT,
    });
    expect(risk.level).toBe('high');
  });

  it('is "high" when there are more than two breaking changes', () => {
    const risk = computeRisk({
      id: toRiskId('risk-1'),
      scope: SCOPE,
      relationships: [relationship('compatible')],
      breakingChanges: [breakingChange('b1'), breakingChange('b2'), breakingChange('b3')],
      snapshotId: SNAPSHOT,
    });
    expect(risk.level).toBe('high');
  });

  it('is "medium" when there is at least one breaking change but no incompatibility', () => {
    const risk = computeRisk({
      id: toRiskId('risk-1'),
      scope: SCOPE,
      relationships: [relationship('compatible')],
      breakingChanges: [breakingChange('b1')],
      snapshotId: SNAPSHOT,
    });
    expect(risk.level).toBe('medium');
  });

  it('is "medium" when a relationship is unverified but nothing is incompatible', () => {
    const risk = computeRisk({
      id: toRiskId('risk-1'),
      scope: SCOPE,
      relationships: [relationship('unverified')],
      breakingChanges: [],
      snapshotId: SNAPSHOT,
    });
    expect(risk.level).toBe('medium');
  });

  it('is "low" when everything is compatible with no breaking changes', () => {
    const risk = computeRisk({
      id: toRiskId('risk-1'),
      scope: SCOPE,
      relationships: [relationship('compatible')],
      breakingChanges: [],
      snapshotId: SNAPSHOT,
    });
    expect(risk.level).toBe('low');
  });

  it('always cites every relationship and breaking change it considered as a contributing factor', () => {
    const rel = relationship('compatible');
    const change = breakingChange('b1');
    const risk = computeRisk({
      id: toRiskId('risk-1'),
      scope: SCOPE,
      relationships: [rel],
      breakingChanges: [change],
      snapshotId: SNAPSHOT,
    });
    expect(risk.contributingFactors).toContainEqual({ kind: 'compatibility-relationship', id: rel.id });
    expect(risk.contributingFactors).toContainEqual({ kind: 'breaking-change', id: change.id });
  });

  it('refuses to compute a risk with no data at all (nothing to point to)', () => {
    expect(() =>
      computeRisk({ id: toRiskId('risk-1'), scope: SCOPE, relationships: [], breakingChanges: [], snapshotId: SNAPSHOT }),
    ).toThrow(UnsubstantiatedRiskError);
  });

  it('is deterministic', () => {
    const input = {
      id: toRiskId('risk-1'),
      scope: SCOPE,
      relationships: [relationship('compatible')],
      breakingChanges: [breakingChange('b1')],
      snapshotId: SNAPSHOT,
    };
    expect(computeRisk(input)).toEqual(computeRisk(input));
  });
});
