import { describe, expect, it } from 'vitest';
import { InvalidEntityError, MissingEvidenceError } from '../src/errors.js';
import { createCompatibilityRelationship } from '../src/compatibility-relationship.js';
import {
  toCompatibilityRelationshipId,
  toEvidenceId,
  toReleaseId,
  toSnapshotId,
} from '../src/ids.js';

const base = {
  id: toCompatibilityRelationshipId('rel-1'),
  releaseAId: toReleaseId('release-a'),
  releaseBId: toReleaseId('release-b'),
  ruleIds: [],
  snapshotId: toSnapshotId('snap-1'),
};

describe('createCompatibilityRelationship (ADR 0006: evidence-mandatory, fail-closed)', () => {
  it('allows "unverified" with zero evidence', () => {
    const relationship = createCompatibilityRelationship({ ...base, status: 'unverified', evidenceIds: [] });
    expect(relationship.status).toBe('unverified');
    expect(relationship.evidenceIds).toEqual([]);
  });

  it('rejects "compatible" with zero evidence', () => {
    expect(() => createCompatibilityRelationship({ ...base, status: 'compatible', evidenceIds: [] })).toThrow(
      MissingEvidenceError,
    );
  });

  it('rejects "incompatible" with zero evidence', () => {
    expect(() => createCompatibilityRelationship({ ...base, status: 'incompatible', evidenceIds: [] })).toThrow(
      MissingEvidenceError,
    );
  });

  it('allows "compatible" when at least one evidence id is cited', () => {
    const relationship = createCompatibilityRelationship({
      ...base,
      status: 'compatible',
      evidenceIds: [toEvidenceId('e1')],
    });
    expect(relationship.status).toBe('compatible');
  });

  it('rejects a release compared against itself', () => {
    expect(() =>
      createCompatibilityRelationship({
        ...base,
        releaseBId: base.releaseAId,
        status: 'unverified',
        evidenceIds: [],
      }),
    ).toThrow(InvalidEntityError);
  });
});
