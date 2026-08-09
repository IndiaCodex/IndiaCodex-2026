import { describe, expect, it } from 'vitest';
import {
  createCompatibilityRelationship,
  createEmptySnapshot,
  toCompatibilityRelationshipId,
  toEvidenceId,
  toSnapshotId,
} from '@compass/domain';
import { BuildCompatibilityMatrixUseCase } from '../src/use-cases/build-compatibility-matrix.use-case.js';
import { InMemorySnapshotRepository } from './fakes.js';
import { NOW, component, discoveredRelease, repository } from './fixtures.js';
import type { Snapshot } from '@compass/domain';

const sdkRepo = repository('sdk-repo');
const runtimeRepo = repository('runtime-repo');
const sdkComponent = component('sdk-a', 'sdk', sdkRepo.id);
const runtimeComponent = component('runtime-a', 'runtime', runtimeRepo.id);
const otherComponent = component('other', 'tool', sdkRepo.id);

const sdkRelease = discoveredRelease({ id: 'sdk-1.0', componentId: 'sdk-a', version: '1.0.0' });
const runtimeRelease = discoveredRelease({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' });
const otherRelease = discoveredRelease({ id: 'other-1.0', componentId: 'other', version: '1.0.0' });

function baseSnapshot(): Snapshot {
  const snapshot = createEmptySnapshot(toSnapshotId('snap-1'), NOW);
  const relationship = createCompatibilityRelationship({
    id: toCompatibilityRelationshipId('rel-1'),
    releaseAId: sdkRelease.id,
    releaseBId: runtimeRelease.id,
    status: 'compatible',
    ruleIds: [],
    evidenceIds: [toEvidenceId('e1')],
    snapshotId: snapshot.id,
  });
  return {
    ...snapshot,
    components: [sdkComponent, runtimeComponent, otherComponent],
    releases: [
      { ...sdkRelease, artifactIds: [], dependencies: [], capabilities: [] },
      { ...runtimeRelease, artifactIds: [], dependencies: [], capabilities: [] },
      { ...otherRelease, artifactIds: [], dependencies: [], capabilities: [] },
    ],
    compatibilityRelationships: [relationship],
  };
}

describe('BuildCompatibilityMatrixUseCase', () => {
  it('returns every relationship in the latest snapshot when no filter is given', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot());
    const useCase = new BuildCompatibilityMatrixUseCase(repo);

    const result = await useCase.execute();

    expect(result.relationships).toHaveLength(1);
  });

  it('filters relationships to only those touching the requested components', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot());
    const useCase = new BuildCompatibilityMatrixUseCase(repo);

    const result = await useCase.execute({ componentIds: [otherComponent.id] });

    expect(result.relationships).toEqual([]);
  });

  it('includes a relationship when the filter matches either side', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot());
    const useCase = new BuildCompatibilityMatrixUseCase(repo);

    const result = await useCase.execute({ componentIds: [runtimeComponent.id] });

    expect(result.relationships).toHaveLength(1);
  });

  it('queries a specific historical snapshot when snapshotId is given', async () => {
    const repo = new InMemorySnapshotRepository();
    const older = { ...baseSnapshot(), id: toSnapshotId('snap-older'), compatibilityRelationships: [] };
    await repo.save(older);
    await repo.save(baseSnapshot());
    const useCase = new BuildCompatibilityMatrixUseCase(repo);

    const result = await useCase.execute({ snapshotId: older.id });

    expect(result.snapshot.id).toBe(older.id);
    expect(result.relationships).toEqual([]);
  });

  it('throws NotFoundError when there is no snapshot at all', async () => {
    const repo = new InMemorySnapshotRepository();
    const useCase = new BuildCompatibilityMatrixUseCase(repo);
    await expect(useCase.execute()).rejects.toThrow(/Snapshot/);
  });

  it('throws NotFoundError for an unknown snapshotId', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot());
    const useCase = new BuildCompatibilityMatrixUseCase(repo);
    await expect(useCase.execute({ snapshotId: toSnapshotId('does-not-exist') })).rejects.toThrow(/Snapshot/);
  });
});
