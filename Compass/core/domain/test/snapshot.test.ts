import { describe, expect, it } from 'vitest';
import { createEmptySnapshot } from '../src/snapshot.js';
import { NOW, SNAPSHOT_ID } from './fixtures.js';

describe('createEmptySnapshot', () => {
  it('creates a snapshot with the given id and timestamp and every collection empty', () => {
    const snapshot = createEmptySnapshot(SNAPSHOT_ID, NOW);
    expect(snapshot.id).toBe(SNAPSHOT_ID);
    expect(snapshot.createdAt).toBe(NOW);
    expect(snapshot.repositories).toEqual([]);
    expect(snapshot.components).toEqual([]);
    expect(snapshot.releases).toEqual([]);
    expect(snapshot.artifacts).toEqual([]);
    expect(snapshot.evidence).toEqual([]);
    expect(snapshot.compatibilityRules).toEqual([]);
    expect(snapshot.compatibilityRelationships).toEqual([]);
    expect(snapshot.breakingChanges).toEqual([]);
    expect(snapshot.risks).toEqual([]);
    expect(snapshot.recommendations).toEqual([]);
  });
});
