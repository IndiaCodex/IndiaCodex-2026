import { describe, expect, it } from 'vitest';
import { InvalidEntityError, UnsubstantiatedRecommendationError } from '../src/errors.js';
import { createRecommendation } from '../src/recommendation.js';
import {
  toCompatibilityRelationshipId,
  toComponentId,
  toRecommendationId,
  toReleaseId,
  toSnapshotId,
} from '../src/ids.js';

const base = {
  id: toRecommendationId('rec-1'),
  subjectComponentId: toComponentId('sdk-a'),
  snapshotId: toSnapshotId('snap-1'),
  rationale: [{ kind: 'compatibility-relationship' as const, id: toCompatibilityRelationshipId('rel-1') }],
};

describe('createRecommendation', () => {
  it('rejects zero rationale entries', () => {
    expect(() => createRecommendation({ ...base, action: 'hold', targetReleaseId: null, rationale: [] })).toThrow(
      UnsubstantiatedRecommendationError,
    );
  });

  it('rejects an "upgrade" action with no targetReleaseId', () => {
    expect(() => createRecommendation({ ...base, action: 'upgrade', targetReleaseId: null })).toThrow(
      InvalidEntityError,
    );
  });

  it('accepts an "upgrade" action with a targetReleaseId', () => {
    const recommendation = createRecommendation({
      ...base,
      action: 'upgrade',
      targetReleaseId: toReleaseId('release-b'),
    });
    expect(recommendation.action).toBe('upgrade');
    expect(recommendation.targetReleaseId).toBe('release-b');
  });

  it('accepts "avoid", "hold", and "investigate-further" with no targetReleaseId', () => {
    for (const action of ['avoid', 'hold', 'investigate-further'] as const) {
      expect(() => createRecommendation({ ...base, action, targetReleaseId: null })).not.toThrow();
    }
  });
});
