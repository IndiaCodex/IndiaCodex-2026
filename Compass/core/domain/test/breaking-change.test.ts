import { describe, expect, it } from 'vitest';
import { CrossComponentBreakingChangeError, InvalidEntityError } from '../src/errors.js';
import { createBreakingChange } from '../src/breaking-change.js';
import { toBreakingChangeId, toEvidenceId } from '../src/ids.js';
import { release } from './fixtures.js';

describe('createBreakingChange (invariant #4: must span two releases of the same Component)', () => {
  it('rejects releases from different components', () => {
    const fromRelease = release({ id: 'r1', componentId: 'component-a', version: '1.0.0' });
    const toRelease = release({ id: 'r2', componentId: 'component-b', version: '1.1.0' });

    expect(() =>
      createBreakingChange({
        id: toBreakingChangeId('bc-1'),
        fromRelease,
        toRelease,
        affectedCapability: null,
        description: 'test',
        detectedViaEvidenceId: toEvidenceId('e1'),
      }),
    ).toThrow(CrossComponentBreakingChangeError);
  });

  it('rejects fromRelease and toRelease being the same release', () => {
    const same = release({ id: 'r1', componentId: 'component-a', version: '1.0.0' });
    expect(() =>
      createBreakingChange({
        id: toBreakingChangeId('bc-1'),
        fromRelease: same,
        toRelease: same,
        affectedCapability: null,
        description: 'test',
        detectedViaEvidenceId: toEvidenceId('e1'),
      }),
    ).toThrow(InvalidEntityError);
  });

  it('accepts two different releases of the same component and derives componentId', () => {
    const fromRelease = release({ id: 'r1', componentId: 'component-a', version: '1.0.0' });
    const toRelease = release({ id: 'r2', componentId: 'component-a', version: '2.0.0' });

    const change = createBreakingChange({
      id: toBreakingChangeId('bc-1'),
      fromRelease,
      toRelease,
      affectedCapability: 'zk-proof-v1',
      description: 'removed zk-proof-v1',
      detectedViaEvidenceId: toEvidenceId('e1'),
    });

    expect(change.componentId).toBe(fromRelease.componentId);
    expect(change.fromReleaseId).toBe(fromRelease.id);
    expect(change.toReleaseId).toBe(toRelease.id);
  });
});
