import { describe, expect, it } from 'vitest';
import { createEmptySnapshot, semVerScheme, toComponentId, toReleaseId, toSnapshotId, versionRange } from '@compass/domain';
import { AnalyzeUpgradeImpactUseCase } from '../src/use-cases/analyze-upgrade-impact.use-case.js';
import { InMemorySnapshotRepository } from './fakes.js';
import { NOW, component, release, releaseEvidence } from './fixtures.js';
import type { Snapshot } from '@compass/domain';

const targetComponent = component('runtime-a', 'runtime', 'runtime-repo');
const targetReleaseOld = release({ id: 'runtime-1.0', componentId: 'runtime-a', version: '1.0.0' });
const targetReleaseNew = release({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' });

const compatibleDependent = component('app-compatible', 'application', 'app-repo');
const compatibleDependentRelease = release({
  id: 'app-compatible-1.0',
  componentId: 'app-compatible',
  version: '1.0.0',
  dependencies: [{ targetComponentId: targetComponent.id, constraint: versionRange('>=1.0.0'), kind: 'required' }],
});

const blockedDependent = component('app-blocked', 'application', 'app-repo');
const blockedDependentRelease = release({
  id: 'app-blocked-1.0',
  componentId: 'app-blocked',
  version: '1.0.0',
  dependencies: [{ targetComponentId: targetComponent.id, constraint: versionRange('^1.0.0'), kind: 'required' }],
});

const unrelatedComponent = component('unrelated', 'tool', 'other-repo');
const unrelatedRelease = release({ id: 'unrelated-1.0', componentId: 'unrelated', version: '1.0.0' });

function baseSnapshot(): Snapshot {
  return {
    ...createEmptySnapshot(toSnapshotId('snap-1'), NOW),
    components: [targetComponent, compatibleDependent, blockedDependent, unrelatedComponent],
    releases: [targetReleaseOld, targetReleaseNew, compatibleDependentRelease, blockedDependentRelease, unrelatedRelease],
    evidence: [
      releaseEvidence('e-target-old', targetReleaseOld.id),
      releaseEvidence('e-target-new', targetReleaseNew.id),
      releaseEvidence('e-compatible', compatibleDependentRelease.id),
      releaseEvidence('e-blocked', blockedDependentRelease.id),
    ],
  };
}

describe('AnalyzeUpgradeImpactUseCase', () => {
  it('classifies dependents as compatible or blocked based on their own declared constraint', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot());
    const useCase = new AnalyzeUpgradeImpactUseCase(repo, semVerScheme);

    const result = await useCase.execute({ targetReleaseId: targetReleaseNew.id });

    expect(result.compatibleComponentIds).toEqual([compatibleDependent.id]);
    expect(result.blockedComponents).toHaveLength(1);
    expect(result.blockedComponents[0]).toMatchObject({
      componentId: blockedDependent.id,
      dependentReleaseId: blockedDependentRelease.id,
    });
  });

  it('never mentions components with no dependency on the target component at all', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot());
    const useCase = new AnalyzeUpgradeImpactUseCase(repo, semVerScheme);

    const result = await useCase.execute({ targetReleaseId: targetReleaseNew.id });

    expect(result.compatibleComponentIds).not.toContain(unrelatedComponent.id);
    expect(result.blockedComponents.map((b) => b.componentId)).not.toContain(unrelatedComponent.id);
    expect(result.unverifiedComponentIds).not.toContain(unrelatedComponent.id);
  });

  it('classifies a dependent as unverified when there is no evidence for the pair', async () => {
    const snapshot = baseSnapshot();
    const noEvidenceSnapshot: Snapshot = { ...snapshot, evidence: [] };
    const repo = new InMemorySnapshotRepository();
    await repo.save(noEvidenceSnapshot);
    const useCase = new AnalyzeUpgradeImpactUseCase(repo, semVerScheme);

    const result = await useCase.execute({ targetReleaseId: targetReleaseNew.id });

    expect([...result.unverifiedComponentIds].sort()).toEqual([blockedDependent.id, compatibleDependent.id].sort());
  });

  it('throws NotFoundError when there is no snapshot', async () => {
    const repo = new InMemorySnapshotRepository();
    const useCase = new AnalyzeUpgradeImpactUseCase(repo, semVerScheme);
    await expect(useCase.execute({ targetReleaseId: targetReleaseNew.id })).rejects.toThrow(/Snapshot/);
  });

  it('throws NotFoundError for an unknown target release', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot());
    const useCase = new AnalyzeUpgradeImpactUseCase(repo, semVerScheme);
    await expect(useCase.execute({ targetReleaseId: toReleaseId('does-not-exist') })).rejects.toThrow(/Release/);
  });

  it('throws NotFoundError when the target release references an unknown component', async () => {
    const snapshot = baseSnapshot();
    const orphanRelease = { ...targetReleaseNew, id: toReleaseId('orphan'), componentId: toComponentId('ghost') };
    const repo = new InMemorySnapshotRepository();
    await repo.save({ ...snapshot, releases: [...snapshot.releases, orphanRelease] });
    const useCase = new AnalyzeUpgradeImpactUseCase(repo, semVerScheme);
    await expect(useCase.execute({ targetReleaseId: orphanRelease.id })).rejects.toThrow(/Component/);
  });

  it('throws NotFoundError when a dependent release references a component missing from the snapshot', async () => {
    const snapshot = baseSnapshot();
    const orphanDependent = release({
      id: 'orphan-dependent',
      componentId: 'ghost-dependent',
      version: '1.0.0',
      dependencies: [{ targetComponentId: targetComponent.id, constraint: versionRange('>=1.0.0'), kind: 'required' }],
    });
    const repo = new InMemorySnapshotRepository();
    await repo.save({ ...snapshot, releases: [...snapshot.releases, orphanDependent] });
    const useCase = new AnalyzeUpgradeImpactUseCase(repo, semVerScheme);
    await expect(useCase.execute({ targetReleaseId: targetReleaseNew.id })).rejects.toThrow(/Component/);
  });
});
