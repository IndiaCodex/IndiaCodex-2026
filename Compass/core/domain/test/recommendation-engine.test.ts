import { describe, expect, it } from 'vitest';
import { generateRecommendation } from '../src/recommendation-engine.js';
import { createCompatibilityRelationship } from '../src/compatibility-relationship.js';
import { createRisk } from '../src/risk.js';
import {
  toCompatibilityRelationshipId,
  toComponentId,
  toEvidenceId,
  toRecommendationId,
  toReleaseId,
  toRiskId,
  toSnapshotId,
} from '../src/ids.js';
import { release } from './fixtures.js';

const SNAPSHOT = toSnapshotId('snap-1');
const SUBJECT = toComponentId('sdk-a');
const TARGET_RELEASE = release({ id: 'target', componentId: 'sdk-a', version: '2.0.0' });

function relationship(status: 'compatible' | 'incompatible' | 'unverified') {
  return createCompatibilityRelationship({
    id: toCompatibilityRelationshipId(`rel-${status}`),
    releaseAId: toReleaseId('current'),
    releaseBId: TARGET_RELEASE.id,
    status,
    ruleIds: [],
    evidenceIds: status === 'unverified' ? [] : [toEvidenceId('e1')],
    snapshotId: SNAPSHOT,
  });
}

function risk(level: 'low' | 'medium' | 'high') {
  return createRisk({
    id: toRiskId(`risk-${level}`),
    scope: { kind: 'component', componentId: SUBJECT },
    level,
    contributingFactors: [{ kind: 'compatibility-relationship', id: toCompatibilityRelationshipId('rel-compatible') }],
    snapshotId: SNAPSHOT,
  });
}

describe('generateRecommendation', () => {
  it('recommends "upgrade" when compatible and risk is not high', () => {
    const recommendation = generateRecommendation({
      id: toRecommendationId('rec-1'),
      subjectComponentId: SUBJECT,
      targetRelease: TARGET_RELEASE,
      relationship: relationship('compatible'),
      risk: risk('low'),
      snapshotId: SNAPSHOT,
    });
    expect(recommendation.action).toBe('upgrade');
    expect(recommendation.targetReleaseId).toBe(TARGET_RELEASE.id);
  });

  it('recommends "upgrade" when compatible and there is no risk data at all', () => {
    const recommendation = generateRecommendation({
      id: toRecommendationId('rec-1'),
      subjectComponentId: SUBJECT,
      targetRelease: TARGET_RELEASE,
      relationship: relationship('compatible'),
      risk: null,
      snapshotId: SNAPSHOT,
    });
    expect(recommendation.action).toBe('upgrade');
  });

  it('recommends "investigate-further" when compatible but risk is high', () => {
    const recommendation = generateRecommendation({
      id: toRecommendationId('rec-1'),
      subjectComponentId: SUBJECT,
      targetRelease: TARGET_RELEASE,
      relationship: relationship('compatible'),
      risk: risk('high'),
      snapshotId: SNAPSHOT,
    });
    expect(recommendation.action).toBe('investigate-further');
    expect(recommendation.targetReleaseId).toBeNull();
  });

  it('recommends "avoid" when incompatible, regardless of risk', () => {
    const recommendation = generateRecommendation({
      id: toRecommendationId('rec-1'),
      subjectComponentId: SUBJECT,
      targetRelease: TARGET_RELEASE,
      relationship: relationship('incompatible'),
      risk: null,
      snapshotId: SNAPSHOT,
    });
    expect(recommendation.action).toBe('avoid');
    expect(recommendation.targetReleaseId).toBeNull();
  });

  it('recommends "hold" when unverified', () => {
    const recommendation = generateRecommendation({
      id: toRecommendationId('rec-1'),
      subjectComponentId: SUBJECT,
      targetRelease: TARGET_RELEASE,
      relationship: relationship('unverified'),
      risk: null,
      snapshotId: SNAPSHOT,
    });
    expect(recommendation.action).toBe('hold');
  });

  it('always cites the relationship, and the risk when one was supplied', () => {
    const rel = relationship('compatible');
    const r = risk('low');
    const recommendation = generateRecommendation({
      id: toRecommendationId('rec-1'),
      subjectComponentId: SUBJECT,
      targetRelease: TARGET_RELEASE,
      relationship: rel,
      risk: r,
      snapshotId: SNAPSHOT,
    });
    expect(recommendation.rationale).toContainEqual({ kind: 'compatibility-relationship', id: rel.id });
    expect(recommendation.rationale).toContainEqual({ kind: 'risk', id: r.id });
  });
});
