import { describe, expect, it } from 'vitest';
import { createBreakingChange, createEmptySnapshot, toBreakingChangeId, toEvidenceId, toSnapshotId } from '@compass/domain';
import { DetectBreakingChangesUseCase } from '../src/use-cases/detect-breaking-changes.use-case.js';
import { InMemorySnapshotRepository } from './fakes.js';
import { NOW, capability, component, discoveredRelease, repository } from './fixtures.js';
import type { Snapshot } from '@compass/domain';

const sdkRepo = repository('sdk-repo');
const sdkComponent = component('sdk-a', 'sdk', sdkRepo.id);

const fromRelease = {
  ...discoveredRelease({ id: 'sdk-1.0', componentId: 'sdk-a', version: '1.0.0' }),
  artifactIds: [],
  dependencies: [],
  capabilities: [capability('legacy-format')],
};
const toReleaseFixture = {
  ...discoveredRelease({ id: 'sdk-2.0', componentId: 'sdk-a', version: '2.0.0' }),
  artifactIds: [],
  dependencies: [],
  capabilities: [],
};

function baseSnapshot(): Snapshot {
  const snapshot = createEmptySnapshot(toSnapshotId('snap-1'), NOW);
  return { ...snapshot, components: [sdkComponent], releases: [fromRelease, toReleaseFixture] };
}

describe('DetectBreakingChangesUseCase', () => {
  it('re-derives candidates live from the two releases even when nothing was recorded during ingestion', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot());
    const useCase = new DetectBreakingChangesUseCase(repo);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromReleaseId: fromRelease.id,
      toReleaseId: toReleaseFixture.id,
    });

    expect(report.recorded).toEqual([]);
    expect(report.candidates).toHaveLength(1);
    expect(report.candidates[0]?.affectedCapability).toBe('legacy-format');
  });

  it('returns previously recorded breaking changes for the exact pair when present', async () => {
    const repo = new InMemorySnapshotRepository();
    const change = createBreakingChange({
      id: toBreakingChangeId('bc-1'),
      fromRelease,
      toRelease: toReleaseFixture,
      affectedCapability: 'legacy-format',
      description: 'test',
      detectedViaEvidenceId: toEvidenceId('e1'),
    });
    await repo.save({ ...baseSnapshot(), breakingChanges: [change] });
    const useCase = new DetectBreakingChangesUseCase(repo);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromReleaseId: fromRelease.id,
      toReleaseId: toReleaseFixture.id,
    });

    expect(report.recorded).toEqual([change]);
  });

  it('throws NotFoundError when the toRelease is unknown', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot());
    const useCase = new DetectBreakingChangesUseCase(repo);

    await expect(
      useCase.execute({
        componentId: sdkComponent.id,
        fromReleaseId: fromRelease.id,
        toReleaseId: 'does-not-exist' as never,
      }),
    ).rejects.toThrow(/Release/);
  });

  it('throws NotFoundError when the fromRelease is unknown', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot());
    const useCase = new DetectBreakingChangesUseCase(repo);

    await expect(
      useCase.execute({
        componentId: sdkComponent.id,
        fromReleaseId: 'does-not-exist' as never,
        toReleaseId: toReleaseFixture.id,
      }),
    ).rejects.toThrow(/Release/);
  });

  it('throws NotFoundError when there is no snapshot at all', async () => {
    const repo = new InMemorySnapshotRepository();
    const useCase = new DetectBreakingChangesUseCase(repo);

    await expect(
      useCase.execute({
        componentId: sdkComponent.id,
        fromReleaseId: fromRelease.id,
        toReleaseId: toReleaseFixture.id,
      }),
    ).rejects.toThrow(/Snapshot/);
  });
});
