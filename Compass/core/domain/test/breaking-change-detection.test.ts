import { describe, expect, it } from 'vitest';
import { CrossComponentBreakingChangeError } from '../src/errors.js';
import { detectBreakingChanges } from '../src/breaking-change-detection.js';
import { capability, release } from './fixtures.js';

describe('detectBreakingChanges', () => {
  it('reports a capability present in the previous release but missing from the next', () => {
    const previous = release({
      id: 'r1',
      componentId: 'sdk-a',
      version: '1.0.0',
      capabilities: [capability('zk-proof-v1')],
    });
    const next = release({ id: 'r2', componentId: 'sdk-a', version: '2.0.0', capabilities: [] });

    const candidates = detectBreakingChanges(previous, next);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      componentId: previous.componentId,
      fromReleaseId: previous.id,
      toReleaseId: next.id,
      affectedCapability: 'zk-proof-v1',
    });
  });

  it('reports nothing when every provided capability carries forward', () => {
    const cap = capability('zk-proof-v1');
    const previous = release({ id: 'r1', componentId: 'sdk-a', version: '1.0.0', capabilities: [cap] });
    const next = release({ id: 'r2', componentId: 'sdk-a', version: '1.1.0', capabilities: [cap] });

    expect(detectBreakingChanges(previous, next)).toEqual([]);
  });

  it('does not report a capability that was only ever required, not provided, going missing', () => {
    const previous = release({
      id: 'r1',
      componentId: 'sdk-a',
      version: '1.0.0',
      capabilities: [capability('runtime-x', '1.0.0', 'required')],
    });
    const next = release({ id: 'r2', componentId: 'sdk-a', version: '1.1.0', capabilities: [] });

    expect(detectBreakingChanges(previous, next)).toEqual([]);
  });

  it('does not report a newly added capability as breaking', () => {
    const previous = release({ id: 'r1', componentId: 'sdk-a', version: '1.0.0', capabilities: [] });
    const next = release({
      id: 'r2',
      componentId: 'sdk-a',
      version: '1.1.0',
      capabilities: [capability('zk-proof-v2')],
    });

    expect(detectBreakingChanges(previous, next)).toEqual([]);
  });

  it('rejects comparing releases of two different components', () => {
    const previous = release({ id: 'r1', componentId: 'sdk-a', version: '1.0.0' });
    const next = release({ id: 'r2', componentId: 'sdk-b', version: '1.0.0' });
    expect(() => detectBreakingChanges(previous, next)).toThrow(CrossComponentBreakingChangeError);
  });

  it('is deterministic: the same pair of releases always yields the same candidates', () => {
    const previous = release({
      id: 'r1',
      componentId: 'sdk-a',
      version: '1.0.0',
      capabilities: [capability('a'), capability('b'), capability('c')],
    });
    const next = release({ id: 'r2', componentId: 'sdk-a', version: '2.0.0', capabilities: [capability('b')] });

    const first = detectBreakingChanges(previous, next);
    const second = detectBreakingChanges(previous, next);
    expect(first).toEqual(second);
  });
});
