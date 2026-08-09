import { describe, expect, it } from 'vitest';
import { UnsubstantiatedRiskError } from '../src/errors.js';
import { createRisk } from '../src/risk.js';
import { toCompatibilityRelationshipId, toRiskId, toComponentId, toSnapshotId } from '../src/ids.js';

describe('createRisk (invariant #5: never authored without underlying data)', () => {
  it('rejects zero contributing factors', () => {
    expect(() =>
      createRisk({
        id: toRiskId('risk-1'),
        scope: { kind: 'component', componentId: toComponentId('sdk-a') },
        level: 'low',
        contributingFactors: [],
        snapshotId: toSnapshotId('snap-1'),
      }),
    ).toThrow(UnsubstantiatedRiskError);
  });

  it('accepts a risk with at least one contributing factor, at any level', () => {
    const risk = createRisk({
      id: toRiskId('risk-1'),
      scope: { kind: 'component', componentId: toComponentId('sdk-a') },
      level: 'low',
      contributingFactors: [{ kind: 'compatibility-relationship', id: toCompatibilityRelationshipId('rel-1') }],
      snapshotId: toSnapshotId('snap-1'),
    });
    expect(risk.level).toBe('low');
    expect(risk.contributingFactors).toHaveLength(1);
  });
});
