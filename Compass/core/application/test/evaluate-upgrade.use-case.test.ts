import { describe, expect, it } from 'vitest';
import {
  createBreakingChange,
  createEmptySnapshot,
  createEvidence,
  semVerScheme,
  toBreakingChangeId,
  toCompatibilityRuleId,
  toEvidenceId,
  toRulePackId,
  toSnapshotId,
  versionRange,
} from '@compass/domain';
import { EvaluateUpgradeUseCase } from '../src/use-cases/evaluate-upgrade.use-case.js';
import { InMemorySnapshotRepository, SequentialIdGenerator } from './fakes.js';
import { NOW, component, discoveredRelease, repository } from './fixtures.js';
import type { CompatibilityRule, Snapshot } from '@compass/domain';

const appRepo = repository('app-repo');
const runtimeRepo = repository('runtime-repo');
const appComponent = component('app-a', 'application', appRepo.id);
const runtimeComponent = component('runtime-a', 'runtime', runtimeRepo.id);

const appRelease = { ...discoveredRelease({ id: 'app-1.0', componentId: 'app-a', version: '1.0.0' }), artifactIds: [], dependencies: [], capabilities: [] };
const runtimeReleaseOld = { ...discoveredRelease({ id: 'runtime-1.0', componentId: 'runtime-a', version: '1.0.0' }), artifactIds: [], dependencies: [], capabilities: [] };
const runtimeReleaseNew = { ...discoveredRelease({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' }), artifactIds: [], dependencies: [], capabilities: [] };

const COMPATIBLE_RULE: CompatibilityRule = {
  id: toCompatibilityRuleId('rule-1'),
  description: 'requires >=2.0.0',
  appliesTo: { componentTypeA: null, componentTypeB: null },
  condition: versionRange('>=2.0.0'),
  conclusion: 'compatible',
  rulePackId: toRulePackId('pack-1'),
};

const INCOMPATIBLE_RULE: CompatibilityRule = {
  id: toCompatibilityRuleId('rule-2'),
  description: 'flags <2.0.0 as incompatible',
  appliesTo: { componentTypeA: null, componentTypeB: null },
  condition: versionRange('<2.0.0'),
  conclusion: 'incompatible',
  rulePackId: toRulePackId('pack-1'),
};

function releaseEvidence(id: string, releaseId: string) {
  return createEvidence({
    id: toEvidenceId(id),
    subject: { kind: 'release', id: releaseId as never },
    sourceType: 'declared-metadata',
    producedBy: 'test-fixture',
    payload: {},
    collectedAt: NOW,
    snapshotId: toSnapshotId('snap-1'),
  });
}

function baseSnapshot(rules: readonly CompatibilityRule[]): Snapshot {
  const snapshot = createEmptySnapshot(toSnapshotId('snap-1'), NOW);
  return {
    ...snapshot,
    components: [appComponent, runtimeComponent],
    releases: [appRelease, runtimeReleaseOld, runtimeReleaseNew],
    compatibilityRules: rules,
    evidence: [
      releaseEvidence('e-app', appRelease.id),
      releaseEvidence('e-runtime-old', runtimeReleaseOld.id),
      releaseEvidence('e-runtime-new', runtimeReleaseNew.id),
    ],
  };
}

function buildUseCase(repo: InMemorySnapshotRepository): EvaluateUpgradeUseCase {
  return new EvaluateUpgradeUseCase(repo, new SequentialIdGenerator(), semVerScheme);
}

function createBreakingChangeFixture() {
  return createBreakingChange({
    id: toBreakingChangeId('bc-1'),
    fromRelease: runtimeReleaseOld,
    toRelease: runtimeReleaseNew,
    affectedCapability: 'cap',
    description: 'test',
    detectedViaEvidenceId: toEvidenceId('e-bc'),
  });
}

describe('EvaluateUpgradeUseCase', () => {
  it('recommends "upgrade" when the target is compatible with the current stack', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot([COMPATIBLE_RULE]));
    const useCase = buildUseCase(repo);

    const result = await useCase.execute({
      subjectComponentId: runtimeComponent.id,
      currentStackReleaseIds: [appRelease.id],
      targetReleaseId: runtimeReleaseNew.id,
    });

    expect(result.recommendation.action).toBe('upgrade');
    expect(result.recommendation.targetReleaseId).toBe(runtimeReleaseNew.id);
  });

  it('recommends "avoid" when any stack member is incompatible with the target', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot([INCOMPATIBLE_RULE]));
    const useCase = buildUseCase(repo);

    const result = await useCase.execute({
      subjectComponentId: runtimeComponent.id,
      currentStackReleaseIds: [appRelease.id],
      targetReleaseId: runtimeReleaseOld.id,
    });

    expect(result.recommendation.action).toBe('avoid');
  });

  it('recommends "hold" when nothing can be determined (no rule fires)', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot([]));
    const useCase = buildUseCase(repo);

    const result = await useCase.execute({
      subjectComponentId: runtimeComponent.id,
      currentStackReleaseIds: [appRelease.id],
      targetReleaseId: runtimeReleaseNew.id,
    });

    expect(result.recommendation.action).toBe('hold');
  });

  it('rejects an empty current stack rather than fabricating a comparison', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot([COMPATIBLE_RULE]));
    const useCase = buildUseCase(repo);

    await expect(
      useCase.execute({
        subjectComponentId: runtimeComponent.id,
        currentStackReleaseIds: [],
        targetReleaseId: runtimeReleaseNew.id,
      }),
    ).rejects.toThrow(/empty stack/);
  });

  it('honors the stack release\'s own declared dependency constraint against the target (ADR 0011), with no rule pack at all', async () => {
    const appReleaseWithDependency = {
      ...appRelease,
      dependencies: [{ targetComponentId: runtimeComponent.id, constraint: versionRange('>=2.0.0'), kind: 'required' as const }],
    };
    const repo = new InMemorySnapshotRepository();
    await repo.save({
      ...baseSnapshot([]),
      releases: [appReleaseWithDependency, runtimeReleaseOld, runtimeReleaseNew],
    });
    const useCase = buildUseCase(repo);

    const result = await useCase.execute({
      subjectComponentId: runtimeComponent.id,
      currentStackReleaseIds: [appReleaseWithDependency.id],
      targetReleaseId: runtimeReleaseOld.id, // 1.0.0 — violates the declared >=2.0.0 constraint
    });

    expect(result.recommendation.action).toBe('avoid');
  });

  it('throws NotFoundError when there is no snapshot at all', async () => {
    const repo = new InMemorySnapshotRepository();
    const useCase = buildUseCase(repo);
    await expect(
      useCase.execute({
        subjectComponentId: runtimeComponent.id,
        currentStackReleaseIds: [appRelease.id],
        targetReleaseId: runtimeReleaseNew.id,
      }),
    ).rejects.toThrow(/Snapshot/);
  });

  it('throws NotFoundError when every currentStackReleaseIds entry is unknown', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot([COMPATIBLE_RULE]));
    const useCase = buildUseCase(repo);

    await expect(
      useCase.execute({
        subjectComponentId: runtimeComponent.id,
        currentStackReleaseIds: ['does-not-exist' as never],
        targetReleaseId: runtimeReleaseNew.id,
      }),
    ).rejects.toThrow(/Release/);
  });

  it('includes only breaking changes that target the exact release being evaluated', async () => {
    const repo = new InMemorySnapshotRepository();
    const snapshot = baseSnapshot([COMPATIBLE_RULE]);
    const change = createBreakingChangeFixture();
    await repo.save({ ...snapshot, breakingChanges: [change] });
    const useCase = buildUseCase(repo);

    const result = await useCase.execute({
      subjectComponentId: runtimeComponent.id,
      currentStackReleaseIds: [appRelease.id],
      targetReleaseId: runtimeReleaseNew.id,
    });

    expect(result.risk.contributingFactors).toContainEqual({ kind: 'breaking-change', id: change.id });
  });

  it('throws NotFoundError for an unknown target release', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot([COMPATIBLE_RULE]));
    const useCase = buildUseCase(repo);

    await expect(
      useCase.execute({
        subjectComponentId: runtimeComponent.id,
        currentStackReleaseIds: [appRelease.id],
        targetReleaseId: 'does-not-exist' as never,
      }),
    ).rejects.toThrow(/Release/);
  });

  it('throws NotFoundError when the target release references a component missing from the snapshot', async () => {
    const repo = new InMemorySnapshotRepository();
    const snapshot = baseSnapshot([COMPATIBLE_RULE]);
    const orphanRelease = { ...runtimeReleaseNew, id: 'orphan-1.0' as never, componentId: 'ghost-component' as never };
    await repo.save({ ...snapshot, releases: [...snapshot.releases, orphanRelease] });
    const useCase = buildUseCase(repo);

    await expect(
      useCase.execute({
        subjectComponentId: runtimeComponent.id,
        currentStackReleaseIds: [appRelease.id],
        targetReleaseId: orphanRelease.id,
      }),
    ).rejects.toThrow(/Component/);
  });

  it('throws NotFoundError when a stack release references a component missing from the snapshot', async () => {
    const repo = new InMemorySnapshotRepository();
    const snapshot = baseSnapshot([COMPATIBLE_RULE]);
    const orphanRelease = { ...appRelease, id: 'orphan-app-1.0' as never, componentId: 'ghost-component' as never };
    await repo.save({ ...snapshot, releases: [...snapshot.releases, orphanRelease] });
    const useCase = buildUseCase(repo);

    await expect(
      useCase.execute({
        subjectComponentId: runtimeComponent.id,
        currentStackReleaseIds: [orphanRelease.id],
        targetReleaseId: runtimeReleaseNew.id,
      }),
    ).rejects.toThrow(/Component/);
  });

  it('is deterministic given the same snapshot and query', async () => {
    const repo = new InMemorySnapshotRepository();
    await repo.save(baseSnapshot([COMPATIBLE_RULE]));

    const query = {
      subjectComponentId: runtimeComponent.id,
      currentStackReleaseIds: [appRelease.id],
      targetReleaseId: runtimeReleaseNew.id,
    };

    const first = await buildUseCase(repo).execute(query);
    const second = await buildUseCase(repo).execute(query);

    expect(first.recommendation.action).toBe(second.recommendation.action);
    expect(first.risk.level).toBe(second.risk.level);
  });
});
