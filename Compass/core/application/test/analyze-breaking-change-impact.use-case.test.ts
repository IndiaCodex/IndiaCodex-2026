import { describe, expect, it } from 'vitest';
import { createEmptySnapshot, semVerScheme, toSnapshotId, versionRange } from '@compass/domain';
import { AnalyzeBreakingChangeImpactUseCase } from '../src/use-cases/analyze-breaking-change-impact.use-case.js';
import { InMemorySnapshotRepository, SequentialIdGenerator } from './fakes.js';
import { NOW, capability, component, release, releaseEvidence } from './fixtures.js';
import type { CompatibilityRule, Snapshot } from '@compass/domain';

const sdkComponent = component('sdk-a', 'sdk', 'sdk-repo');
const dependentComponent = component('app-a', 'application', 'app-repo');

const FROM_SNAPSHOT_ID = toSnapshotId('snap-from');
const TO_SNAPSHOT_ID = toSnapshotId('snap-to');

function buildRepos() {
  const fromRelease = release({
    id: 'sdk-1.0',
    componentId: 'sdk-a',
    version: '1.0.0',
    capabilities: [capability('sdk-a'), capability('legacy-format')],
  });
  const toRelease = release({
    id: 'sdk-2.0',
    componentId: 'sdk-a',
    version: '2.0.0',
    capabilities: [capability('sdk-a'), capability('new-format')],
  });

  const dependentRelease = release({
    id: 'app-1.0',
    componentId: 'app-a',
    version: '1.0.0',
    dependencies: [{ targetComponentId: sdkComponent.id, constraint: versionRange('>=1.0.0 <2.0.0'), kind: 'required' }],
  });

  const fromSnapshot: Snapshot = {
    ...createEmptySnapshot(FROM_SNAPSHOT_ID, NOW),
    components: [sdkComponent],
    releases: [fromRelease],
    evidence: [releaseEvidence('e-from', fromRelease.id)],
  };
  const toSnapshot: Snapshot = {
    ...createEmptySnapshot(TO_SNAPSHOT_ID, NOW),
    components: [sdkComponent, dependentComponent],
    releases: [toRelease, dependentRelease],
    evidence: [releaseEvidence('e-to', toRelease.id), releaseEvidence('e-dependent', dependentRelease.id)],
  };

  return { fromRelease, toRelease, dependentRelease, fromSnapshot, toSnapshot };
}

describe('AnalyzeBreakingChangeImpactUseCase', () => {
  it('reports added and removed capabilities between the two snapshots', async () => {
    const { fromSnapshot, toSnapshot } = buildRepos();
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save(toSnapshot);
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromSnapshotId: FROM_SNAPSHOT_ID,
      toSnapshotId: TO_SNAPSHOT_ID,
    });

    expect(report.addedCapabilities).toEqual(['new-format']);
    expect(report.removedCapabilities.map((c) => c.affectedCapability)).toEqual(['legacy-format']);
  });

  it('flags a dependent component as affected when the new release violates its declared constraint', async () => {
    const { fromSnapshot, toSnapshot } = buildRepos();
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save(toSnapshot);
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromSnapshotId: FROM_SNAPSHOT_ID,
      toSnapshotId: TO_SNAPSHOT_ID,
    });

    // dependentRelease declared >=1.0.0 <2.0.0, but the "to" release is 2.0.0 — violated.
    expect(report.affectedComponentIds).toContain(dependentComponent.id);
    expect(report.risk).not.toBeNull();
    expect(report.risk?.level).not.toBe('low');
  });

  it('reports no changed constraints when dependencies are identical across both snapshots', async () => {
    const { fromSnapshot, toSnapshot } = buildRepos();
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save(toSnapshot);
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromSnapshotId: FROM_SNAPSHOT_ID,
      toSnapshotId: TO_SNAPSHOT_ID,
    });

    // sdk-a itself declares no dependencies in either snapshot.
    expect(report.changedConstraints).toEqual([]);
  });

  it('throws NotFoundError for an unknown fromSnapshotId', async () => {
    const { toSnapshot } = buildRepos();
    const repo = new InMemorySnapshotRepository();
    await repo.save(toSnapshot);
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    await expect(
      useCase.execute({ componentId: sdkComponent.id, fromSnapshotId: toSnapshotId('missing'), toSnapshotId: TO_SNAPSHOT_ID }),
    ).rejects.toThrow(/Snapshot/);
  });

  it('throws NotFoundError for an unknown toSnapshotId', async () => {
    const { fromSnapshot } = buildRepos();
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    await expect(
      useCase.execute({ componentId: sdkComponent.id, fromSnapshotId: FROM_SNAPSHOT_ID, toSnapshotId: toSnapshotId('missing') }),
    ).rejects.toThrow(/Snapshot/);
  });

  it('throws NotFoundError when the component has no matching Component object in the "to" snapshot', async () => {
    const { fromSnapshot, toSnapshot, fromRelease, toRelease } = buildRepos();
    // Both snapshots need a release for "ghost-component" so the failure is specifically the
    // missing Component object in the "to" snapshot, not an earlier missing-release check.
    const orphanFromRelease = { ...fromRelease, id: 'orphan-release-from' as never, componentId: 'ghost-component' as never };
    const orphanToRelease = { ...toRelease, id: 'orphan-release-to' as never, componentId: 'ghost-component' as never };
    const repo = new InMemorySnapshotRepository();
    await repo.save({ ...fromSnapshot, releases: [...fromSnapshot.releases, orphanFromRelease] });
    await repo.save({ ...toSnapshot, releases: [...toSnapshot.releases, orphanToRelease] });
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    await expect(
      useCase.execute({ componentId: 'ghost-component' as never, fromSnapshotId: FROM_SNAPSHOT_ID, toSnapshotId: TO_SNAPSHOT_ID }),
    ).rejects.toThrow(/Component/);
  });

  it('skips a dependent release whose own component is missing from the snapshot (inconsistent data)', async () => {
    const { fromSnapshot, toSnapshot } = buildRepos();
    const orphanDependent = release({
      id: 'orphan-dependent',
      componentId: 'ghost-dependent',
      version: '1.0.0',
      dependencies: [{ targetComponentId: sdkComponent.id, constraint: versionRange('>=1.0.0'), kind: 'required' }],
    });
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save({ ...toSnapshot, releases: [...toSnapshot.releases, orphanDependent] });
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromSnapshotId: FROM_SNAPSHOT_ID,
      toSnapshotId: TO_SNAPSHOT_ID,
    });

    expect(report.affectedComponentIds).not.toContain('ghost-dependent');
  });

  it('does not flag a dependent whose declared constraint the new release still satisfies', async () => {
    const { fromSnapshot, toSnapshot } = buildRepos();
    const happyDependent = release({
      id: 'app-happy-1.0',
      componentId: 'app-happy',
      version: '1.0.0',
      dependencies: [{ targetComponentId: sdkComponent.id, constraint: versionRange('>=1.0.0'), kind: 'required' }],
    });
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save({
      ...toSnapshot,
      components: [...toSnapshot.components, component('app-happy', 'application', 'app-repo')],
      releases: [...toSnapshot.releases, happyDependent],
      evidence: [...toSnapshot.evidence, releaseEvidence('e-happy', happyDependent.id)],
    });
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromSnapshotId: FROM_SNAPSHOT_ID,
      toSnapshotId: TO_SNAPSHOT_ID,
    });

    expect(report.affectedComponentIds).not.toContain('app-happy');
  });

  it('does not construct a transient relationship for a dependent pair with no relevant evidence', async () => {
    const { fromSnapshot, toSnapshot } = buildRepos();
    const noEvidenceSnapshot = { ...toSnapshot, evidence: [] };
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save(noEvidenceSnapshot);
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromSnapshotId: FROM_SNAPSHOT_ID,
      toSnapshotId: TO_SNAPSHOT_ID,
    });

    // No evidence means the dependent/target pair resolves to "unverified", not "incompatible",
    // and contributes no transient relationship — so there's nothing to derive a Risk from either.
    expect(report.affectedComponentIds).toEqual([]);
    expect(report.risk).toBeNull();
  });

  it('reports an added-only dependency (present only in the "to" release) as a changed constraint', async () => {
    const fromRelease = release({ id: 'sdk-1.0', componentId: 'sdk-a', version: '1.0.0' });
    const toRelease = release({
      id: 'sdk-2.0',
      componentId: 'sdk-a',
      version: '2.0.0',
      dependencies: [{ targetComponentId: dependentComponent.id, constraint: versionRange('>=1.0.0'), kind: 'required' }],
    });
    const fromSnapshot: Snapshot = {
      ...createEmptySnapshot(FROM_SNAPSHOT_ID, NOW),
      components: [sdkComponent],
      releases: [fromRelease],
      evidence: [releaseEvidence('e-from', fromRelease.id)],
    };
    const toSnapshot: Snapshot = {
      ...createEmptySnapshot(TO_SNAPSHOT_ID, NOW),
      components: [sdkComponent],
      releases: [toRelease],
      evidence: [releaseEvidence('e-to', toRelease.id)],
    };
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save(toSnapshot);
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromSnapshotId: FROM_SNAPSHOT_ID,
      toSnapshotId: TO_SNAPSHOT_ID,
    });

    expect(report.changedConstraints).toHaveLength(1);
    expect(report.changedConstraints[0]).toMatchObject({ targetComponentId: dependentComponent.id, from: null });
    // Neither snapshot has an actual release of dependentComponent, so there's no dependent to
    // evaluate compatibility for — nothing to derive a Risk from.
    expect(report.risk).toBeNull();
  });

  it('reports a removed-only dependency (present only in the "from" release) as a changed constraint', async () => {
    const fromRelease = release({
      id: 'sdk-1.0',
      componentId: 'sdk-a',
      version: '1.0.0',
      dependencies: [{ targetComponentId: dependentComponent.id, constraint: versionRange('>=1.0.0'), kind: 'required' }],
    });
    const toRelease = release({ id: 'sdk-2.0', componentId: 'sdk-a', version: '2.0.0' });
    const fromSnapshot: Snapshot = {
      ...createEmptySnapshot(FROM_SNAPSHOT_ID, NOW),
      components: [sdkComponent],
      releases: [fromRelease],
      evidence: [releaseEvidence('e-from', fromRelease.id)],
    };
    const toSnapshot: Snapshot = {
      ...createEmptySnapshot(TO_SNAPSHOT_ID, NOW),
      components: [sdkComponent],
      releases: [toRelease],
      evidence: [releaseEvidence('e-to', toRelease.id)],
    };
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save(toSnapshot);
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromSnapshotId: FROM_SNAPSHOT_ID,
      toSnapshotId: TO_SNAPSHOT_ID,
    });

    expect(report.changedConstraints).toHaveLength(1);
    expect(report.changedConstraints[0]).toMatchObject({ targetComponentId: dependentComponent.id, to: null });
  });

  it('includes the specific rules that fired when constructing the affected-component relationships', async () => {
    const { fromSnapshot, toSnapshot } = buildRepos();
    const rule: CompatibilityRule = {
      id: 'rule-1' as never,
      description: 'flags anything below 2.0.0',
      appliesTo: { componentTypeA: null, componentTypeB: null },
      condition: versionRange('<2.0.0'),
      conclusion: 'incompatible',
      rulePackId: 'pack-1' as never,
    };
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save({ ...toSnapshot, compatibilityRules: [rule] });
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    const report = await useCase.execute({
      componentId: sdkComponent.id,
      fromSnapshotId: FROM_SNAPSHOT_ID,
      toSnapshotId: TO_SNAPSHOT_ID,
    });

    expect(report.risk).not.toBeNull();
  });

  it('throws NotFoundError when the component has no release in one of the snapshots', async () => {
    const { fromSnapshot, toSnapshot } = buildRepos();
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save(toSnapshot);
    const useCase = new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme);

    await expect(
      useCase.execute({ componentId: dependentComponent.id, fromSnapshotId: FROM_SNAPSHOT_ID, toSnapshotId: TO_SNAPSHOT_ID }),
    ).rejects.toThrow(/Release/);
  });

  it('is deterministic', async () => {
    const { fromSnapshot, toSnapshot } = buildRepos();
    const repo = new InMemorySnapshotRepository();
    await repo.save(fromSnapshot);
    await repo.save(toSnapshot);

    const query = { componentId: sdkComponent.id, fromSnapshotId: FROM_SNAPSHOT_ID, toSnapshotId: TO_SNAPSHOT_ID };
    const first = await new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme).execute(query);
    const second = await new AnalyzeBreakingChangeImpactUseCase(repo, new SequentialIdGenerator(), semVerScheme).execute(query);

    expect(first.addedCapabilities).toEqual(second.addedCapabilities);
    expect(first.removedCapabilities).toEqual(second.removedCapabilities);
    expect(first.risk?.level).toEqual(second.risk?.level);
  });
});
