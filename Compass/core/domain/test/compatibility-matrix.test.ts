import { describe, expect, it } from 'vitest';
import { buildCompatibilityMatrixView, evaluateStackCompatibility, worseStatus } from '../src/compatibility-matrix.js';
import { createCompatibilityRelationship } from '../src/compatibility-relationship.js';
import { toCompatibilityRelationshipId, toEvidenceId, toSnapshotId } from '../src/ids.js';
import { release } from './fixtures.js';
import type { CompatibilityStatus } from '../src/compatibility-relationship.js';

const SNAPSHOT = toSnapshotId('snap-1');

function relationship(
  id: string,
  releaseAId: string,
  releaseBId: string,
  status: CompatibilityStatus,
) {
  return createCompatibilityRelationship({
    id: toCompatibilityRelationshipId(id),
    releaseAId: releaseAId as never,
    releaseBId: releaseBId as never,
    status,
    ruleIds: [],
    evidenceIds: status === 'unverified' ? [] : [toEvidenceId('e1')],
    snapshotId: SNAPSHOT,
  });
}

describe('worseStatus', () => {
  it('ranks incompatible > unverified > compatible', () => {
    expect(worseStatus('compatible', 'unverified')).toBe('unverified');
    expect(worseStatus('unverified', 'incompatible')).toBe('incompatible');
    expect(worseStatus('incompatible', 'compatible')).toBe('incompatible');
  });

  it('is idempotent for equal statuses', () => {
    expect(worseStatus('compatible', 'compatible')).toBe('compatible');
  });
});

describe('buildCompatibilityMatrixView', () => {
  const appRelease = release({ id: 'app-1', componentId: 'app', version: '1.0.0' });
  const sdkReleaseA = release({ id: 'sdk-1', componentId: 'sdk', version: '1.0.0' });
  const sdkReleaseB = release({ id: 'sdk-2', componentId: 'sdk', version: '2.0.0' });
  const runtimeRelease = release({ id: 'runtime-1', componentId: 'runtime', version: '1.0.0' });

  it('produces one cell per distinct directed component pair, listing every contributing relationship', () => {
    const relationships = [
      relationship('r1', appRelease.id, sdkReleaseA.id, 'compatible'),
      relationship('r2', appRelease.id, sdkReleaseB.id, 'incompatible'),
      relationship('r3', appRelease.id, runtimeRelease.id, 'unverified'),
    ];
    const matrix = buildCompatibilityMatrixView(relationships, [appRelease, sdkReleaseA, sdkReleaseB, runtimeRelease]);

    expect([...matrix.componentIds].sort()).toEqual(['app', 'runtime', 'sdk'].sort());
    const appToSdk = matrix.cells.find((cell) => cell.componentAId === 'app' && cell.componentBId === 'sdk');
    expect(appToSdk?.status).toBe('incompatible'); // worst of compatible + incompatible
    expect([...(appToSdk?.relationshipIds ?? [])].sort()).toEqual(['r1', 'r2'].sort());

    const appToRuntime = matrix.cells.find((cell) => cell.componentAId === 'app' && cell.componentBId === 'runtime');
    expect(appToRuntime?.status).toBe('unverified');
  });

  it('skips relationships whose releases are not in the given release set', () => {
    const relationships = [relationship('r1', 'unknown-release-a', 'unknown-release-b', 'compatible')];
    const matrix = buildCompatibilityMatrixView(relationships, [appRelease]);
    expect(matrix.cells).toEqual([]);
  });

  it('returns an empty matrix for no relationships', () => {
    expect(buildCompatibilityMatrixView([], [appRelease])).toEqual({ componentIds: [], cells: [] });
  });
});

describe('evaluateStackCompatibility', () => {
  const appRelease = release({ id: 'app-1', componentId: 'app', version: '1.0.0' });
  const sdkRelease = release({ id: 'sdk-1', componentId: 'sdk', version: '1.0.0' });
  const runtimeRelease = release({ id: 'runtime-1', componentId: 'runtime', version: '1.0.0' });

  it('is "unverified" when no relationship touches the stack at all', () => {
    const result = evaluateStackCompatibility([appRelease.id, sdkRelease.id], []);
    expect(result.status).toBe('unverified');
    expect(result.contributingRelationships).toEqual([]);
  });

  it('is "compatible" when every relationship among stack members is compatible', () => {
    const relationships = [relationship('r1', appRelease.id, sdkRelease.id, 'compatible')];
    const result = evaluateStackCompatibility([appRelease.id, sdkRelease.id], relationships);
    expect(result.status).toBe('compatible');
    expect(result.contributingRelationships).toHaveLength(1);
  });

  it('is "incompatible" when any relationship among stack members is incompatible, even if others are compatible', () => {
    const relationships = [
      relationship('r1', appRelease.id, sdkRelease.id, 'compatible'),
      relationship('r2', appRelease.id, runtimeRelease.id, 'incompatible'),
    ];
    const result = evaluateStackCompatibility([appRelease.id, sdkRelease.id, runtimeRelease.id], relationships);
    expect(result.status).toBe('incompatible');
    expect(result.contributingRelationships).toHaveLength(2);
  });

  it('ignores relationships that touch a release outside the given stack', () => {
    const relationships = [relationship('r1', appRelease.id, 'some-other-release', 'incompatible')];
    const result = evaluateStackCompatibility([appRelease.id, sdkRelease.id], relationships);
    expect(result.status).toBe('unverified');
    expect(result.contributingRelationships).toEqual([]);
  });
});
