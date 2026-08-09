import { describe, expect, it } from 'vitest';
import { createEmptySnapshot } from '../src/snapshot.js';
import {
  artifactsOfRelease,
  breakingChangesForComponent,
  evidenceByIds,
  findComponent,
  findRelease,
  latestRelease,
  relationshipsInvolvingComponent,
  relationshipsInvolvingRelease,
  releasesOfComponent,
} from '../src/knowledge-graph.js';
import { createBreakingChange } from '../src/breaking-change.js';
import { createCompatibilityRelationship } from '../src/compatibility-relationship.js';
import { createEvidence } from '../src/evidence.js';
import { semVerScheme } from '../src/version.js';
import {
  toArtifactId,
  toBreakingChangeId,
  toCompatibilityRelationshipId,
  toComponentId,
  toEvidenceId,
  toReleaseId,
} from '../src/ids.js';
import { component, release, NOW, SNAPSHOT_ID } from './fixtures.js';
import type { Snapshot } from '../src/snapshot.js';

function snapshotWith(overrides: Partial<Snapshot>): Snapshot {
  return { ...createEmptySnapshot(SNAPSHOT_ID, NOW), ...overrides };
}

describe('findComponent / findRelease', () => {
  it('finds an existing entity and returns undefined for a missing one', () => {
    const c = component('sdk-a');
    const snapshot = snapshotWith({ components: [c] });
    expect(findComponent(snapshot, c.id)).toBe(c);
    expect(findComponent(snapshot, toComponentId('missing'))).toBeUndefined();
  });
});

describe('findRelease', () => {
  it('finds an existing release and returns undefined for a missing one', () => {
    const r = release({ id: 'r1', componentId: 'sdk-a', version: '1.0.0' });
    const snapshot = snapshotWith({ releases: [r] });
    expect(findRelease(snapshot, r.id)).toBe(r);
    expect(findRelease(snapshot, toReleaseId('missing'))).toBeUndefined();
  });
});

describe('releasesOfComponent / latestRelease', () => {
  it('filters releases by component and finds the highest version under the given scheme', () => {
    const r1 = release({ id: 'r1', componentId: 'sdk-a', version: '1.0.0' });
    const r2 = release({ id: 'r2', componentId: 'sdk-a', version: '2.0.0' });
    const other = release({ id: 'r3', componentId: 'sdk-b', version: '9.0.0' });
    const snapshot = snapshotWith({ releases: [r1, r2, other] });

    expect(releasesOfComponent(snapshot, r1.componentId)).toEqual([r1, r2]);
    expect(latestRelease(snapshot, r1.componentId, semVerScheme)).toBe(r2);
  });

  it('keeps the running latest when a later-listed release is actually older', () => {
    const r1 = release({ id: 'r1', componentId: 'sdk-a', version: '1.0.0' });
    const r2 = release({ id: 'r2', componentId: 'sdk-a', version: '2.0.0' });
    const r0 = release({ id: 'r0', componentId: 'sdk-a', version: '0.5.0' });
    const snapshot = snapshotWith({ releases: [r1, r2, r0] });

    expect(latestRelease(snapshot, r1.componentId, semVerScheme)).toBe(r2);
  });

  it('returns undefined when the component has no releases', () => {
    const snapshot = snapshotWith({});
    expect(latestRelease(snapshot, component('none').id, semVerScheme)).toBeUndefined();
  });
});

describe('artifactsOfRelease', () => {
  it('filters artifacts by releaseId', () => {
    const releaseId = toReleaseId('r1');
    const artifact = { id: toArtifactId('a1'), releaseId, type: 'package' as const, locator: 'pkg://a1' };
    const snapshot = snapshotWith({ artifacts: [artifact] });
    expect(artifactsOfRelease(snapshot, releaseId)).toEqual([artifact]);
    expect(artifactsOfRelease(snapshot, toReleaseId('other'))).toEqual([]);
  });
});

describe('evidenceByIds', () => {
  it('returns only the requested evidence, in snapshot order', () => {
    const e1 = createEvidence({
      id: toEvidenceId('e1'),
      subject: { kind: 'release', id: toReleaseId('r1') },
      sourceType: 'declared-metadata',
      producedBy: 'test',
      payload: {},
      collectedAt: NOW,
      snapshotId: SNAPSHOT_ID,
    });
    const e2 = createEvidence({
      id: toEvidenceId('e2'),
      subject: { kind: 'release', id: toReleaseId('r2') },
      sourceType: 'declared-metadata',
      producedBy: 'test',
      payload: {},
      collectedAt: NOW,
      snapshotId: SNAPSHOT_ID,
    });
    const snapshot = snapshotWith({ evidence: [e1, e2] });
    expect(evidenceByIds(snapshot, [e2.id])).toEqual([e2]);
  });
});

describe('relationshipsInvolvingRelease / relationshipsInvolvingComponent', () => {
  it('finds relationships where the release is either side', () => {
    const releaseA = release({ id: 'ra', componentId: 'sdk-a', version: '1.0.0' });
    const releaseB = release({ id: 'rb', componentId: 'sdk-b', version: '1.0.0' });
    const rel = createCompatibilityRelationship({
      id: toCompatibilityRelationshipId('rel-1'),
      releaseAId: releaseA.id,
      releaseBId: releaseB.id,
      status: 'unverified',
      ruleIds: [],
      evidenceIds: [],
      snapshotId: SNAPSHOT_ID,
    });
    const snapshot = snapshotWith({ releases: [releaseA, releaseB], compatibilityRelationships: [rel] });

    expect(relationshipsInvolvingRelease(snapshot, releaseA.id)).toEqual([rel]);
    expect(relationshipsInvolvingRelease(snapshot, releaseB.id)).toEqual([rel]);
    expect(relationshipsInvolvingComponent(snapshot, releaseA.componentId)).toEqual([rel]);
    // Matches via the B-side release's component too — exercises the second half of the OR.
    expect(relationshipsInvolvingComponent(snapshot, releaseB.componentId)).toEqual([rel]);
    // A component with no releases at all has no involving relationships.
    expect(relationshipsInvolvingComponent(snapshot, component('unrelated-component').id)).toEqual([]);
  });
});

describe('breakingChangesForComponent', () => {
  it('filters by componentId', () => {
    const from = release({ id: 'from', componentId: 'sdk-a', version: '1.0.0' });
    const to = release({ id: 'to', componentId: 'sdk-a', version: '2.0.0' });
    const change = createBreakingChange({
      id: toBreakingChangeId('bc-1'),
      fromRelease: from,
      toRelease: to,
      affectedCapability: null,
      description: 'test',
      detectedViaEvidenceId: toEvidenceId('e1'),
    });
    const snapshot = snapshotWith({ breakingChanges: [change] });
    expect(breakingChangesForComponent(snapshot, from.componentId)).toEqual([change]);
    expect(breakingChangesForComponent(snapshot, component('unrelated').id)).toEqual([]);
  });
});
