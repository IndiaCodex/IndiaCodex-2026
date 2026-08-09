import { describe, expect, it } from 'vitest';
import { MissingEvidenceError } from '../src/errors.js';
import { createEvidence } from '../src/evidence.js';
import { meetsMinimumStrength, requireEvidence, strongestSourceType } from '../src/evidence-engine.js';
import { toEvidenceId, toReleaseId, toTimestamp, toSnapshotId } from '../src/ids.js';
import type { Evidence } from '../src/evidence.js';

const NOW = toTimestamp('2026-01-01T00:00:00.000Z');
const SNAPSHOT = toSnapshotId('snap-1');

function evidence(id: string, sourceType: Evidence['sourceType']): Evidence {
  return createEvidence({
    id: toEvidenceId(id),
    subject: { kind: 'release', id: toReleaseId('release-a') },
    sourceType,
    producedBy: 'test-plugin',
    payload: {},
    collectedAt: NOW,
    snapshotId: SNAPSHOT,
  });
}

describe('createEvidence', () => {
  it('rejects an empty producedBy', () => {
    expect(() =>
      createEvidence({
        id: toEvidenceId('e1'),
        subject: { kind: 'release', id: toReleaseId('r1') },
        sourceType: 'declared-metadata',
        producedBy: '  ',
        payload: {},
        collectedAt: NOW,
        snapshotId: SNAPSHOT,
      }),
    ).toThrow(/producedBy/);
  });
});

describe('requireEvidence', () => {
  it('throws MissingEvidenceError when the list is empty', () => {
    expect(() => {
      requireEvidence([], 'test context');
    }).toThrow(MissingEvidenceError);
  });

  it('does not throw when at least one evidence id is present', () => {
    expect(() => {
      requireEvidence([toEvidenceId('e1')], 'test context');
    }).not.toThrow();
  });

  it('includes the given context in the error message', () => {
    expect(() => {
      requireEvidence([], 'CompatibilityRelationship rel-1');
    }).toThrow(/CompatibilityRelationship rel-1/);
  });
});

describe('strongestSourceType', () => {
  it('returns null for an empty set', () => {
    expect(strongestSourceType([])).toBeNull();
  });

  it('ranks observed-result and declared-metadata above maintainer-declaration and community-report', () => {
    const items = [evidence('e1', 'community-report'), evidence('e2', 'declared-metadata')];
    expect(strongestSourceType(items)).toBe('declared-metadata');
  });

  it('is order-independent', () => {
    const forward = [evidence('e1', 'community-report'), evidence('e2', 'observed-result')];
    const backward = [evidence('e2', 'observed-result'), evidence('e1', 'community-report')];
    expect(strongestSourceType(forward)).toBe(strongestSourceType(backward));
  });
});

describe('meetsMinimumStrength', () => {
  it('is true when at least one item meets the threshold', () => {
    const items = [evidence('e1', 'community-report'), evidence('e2', 'observed-result')];
    expect(meetsMinimumStrength(items, 'declared-metadata')).toBe(true);
  });

  it('is false when no item meets the threshold', () => {
    const items = [evidence('e1', 'community-report'), evidence('e2', 'maintainer-declaration')];
    expect(meetsMinimumStrength(items, 'declared-metadata')).toBe(false);
  });

  it('is false for an empty set', () => {
    expect(meetsMinimumStrength([], 'community-report')).toBe(false);
  });
});
