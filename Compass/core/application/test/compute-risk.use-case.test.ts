import { describe, expect, it } from 'vitest';
import {
  createBreakingChange,
  createCompatibilityRelationship,
  createEmptySnapshot,
  semVerScheme,
  toCompatibilityRelationshipId,
  toEvidenceId,
  toBreakingChangeId,
  toReleaseId,
  toSnapshotId,
} from '@compass/domain';
import { ComputeRiskUseCase } from '../src/use-cases/compute-risk.use-case.js';
import { InMemorySnapshotRepository, SequentialIdGenerator } from './fakes.js';
import { NOW, component, discoveredRelease, repository } from './fixtures.js';
import type { Snapshot } from '@compass/domain';

const sdkRepo = repository('sdk-repo');
const runtimeRepo = repository('runtime-repo');
const sdkComponent = component('sdk-a', 'sdk', sdkRepo.id);
const runtimeComponent = component('runtime-a', 'runtime', runtimeRepo.id);

const sdkRelease = { ...discoveredRelease({ id: 'sdk-1.0', componentId: 'sdk-a', version: '1.0.0' }), artifactIds: [], dependencies: [], capabilities: [] };
const runtimeRelease = { ...discoveredRelease({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' }), artifactIds: [], dependencies: [], capabilities: [] };

function snapshotWithIncompatibility(): Snapshot {
  const snapshot = createEmptySnapshot(toSnapshotId('snap-1'), NOW);
  const relationship = createCompatibilityRelationship({
    id: toCompatibilityRelationshipId('rel-1'),
    releaseAId: sdkRelease.id,
    releaseBId: runtimeRelease.id,
    status: 'incompatible',
    ruleIds: [],
    evidenceIds: [toEvidenceId('e1')],
    snapshotId: snapshot.id,
  });
  return {
    ...snapshot,
    components: [sdkComponent, runtimeComponent],
    releases: [sdkRelease, runtimeRelease],
    compatibilityRelationships: [relationship],
  };
}

describe('ComputeRiskUseCase', () => {
  it('computes risk scoped to a component', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(snapshotWithIncompatibility());
    const useCase = new ComputeRiskUseCase(repo, new SequentialIdGenerator());

    const risk = await useCase.execute({ scope: { kind: 'component', componentId: sdkComponent.id } });

    expect(risk?.level).toBe('high');
    expect(risk?.contributingFactors).toHaveLength(1);
  });

  it('computes risk scoped to a repository, aggregating every component in it', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(snapshotWithIncompatibility());
    const useCase = new ComputeRiskUseCase(repo, new SequentialIdGenerator());

    // sdkComponent and runtimeComponent are in different repos in this fixture; scope to sdkRepo only.
    const risk = await useCase.execute({ scope: { kind: 'repository', repositoryId: sdkRepo.id } });

    expect(risk?.level).toBe('high');
  });

  it('computes risk scoped to an arbitrary declared stack of release ids', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(snapshotWithIncompatibility());
    const useCase = new ComputeRiskUseCase(repo, new SequentialIdGenerator());

    const risk = await useCase.execute({
      scope: { kind: 'declared-stack', releaseIds: [sdkRelease.id, runtimeRelease.id] },
    });

    expect(risk?.level).toBe('high');
  });

  it('includes breaking changes for components in scope as contributing factors', async () => {
    const repo = new InMemorySnapshotRepository();
    const base = snapshotWithIncompatibility();
    const change = createBreakingChange({
      id: toBreakingChangeId('bc-1'),
      fromRelease: runtimeRelease,
      toRelease: { ...runtimeRelease, id: toReleaseId('runtime-3.0'), version: semVerScheme.parse('3.0.0') },
      affectedCapability: 'cap',
      description: 'test',
      detectedViaEvidenceId: toEvidenceId('e2'),
    });
    await repo.save({ ...base, breakingChanges: [change] });
    const useCase = new ComputeRiskUseCase(repo, new SequentialIdGenerator());

    const risk = await useCase.execute({ scope: { kind: 'component', componentId: runtimeComponent.id } });

    expect(risk?.contributingFactors).toContainEqual({ kind: 'breaking-change', id: change.id });
  });

  it('returns null (not a crash) for a scope with no relationships and no breaking changes', async () => {
    const repo = new InMemorySnapshotRepository();
    const emptySnapshot = createEmptySnapshot(toSnapshotId('snap-empty'), NOW);
    await repo.save({ ...emptySnapshot, components: [sdkComponent], releases: [sdkRelease] });
    const useCase = new ComputeRiskUseCase(repo, new SequentialIdGenerator());

    const risk = await useCase.execute({ scope: { kind: 'component', componentId: sdkComponent.id } });

    expect(risk).toBeNull();
  });

  it('throws NotFoundError when there is no snapshot yet', async () => {
    const repo = new InMemorySnapshotRepository();
    const useCase = new ComputeRiskUseCase(repo, new SequentialIdGenerator());
    await expect(useCase.execute({ scope: { kind: 'component', componentId: sdkComponent.id } })).rejects.toThrow(
      /Snapshot/,
    );
  });
});
