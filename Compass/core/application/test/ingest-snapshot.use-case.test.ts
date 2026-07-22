import { describe, expect, it } from 'vitest';
import { createEvidence, semVerScheme, toCompatibilityRuleId, toEvidenceId, toRulePackId, versionRange } from '@compass/domain';
import { IngestSnapshotUseCase } from '../src/use-cases/ingest-snapshot.use-case.js';
import {
  FakeCapabilityExtractor,
  FakeRulePack,
  FakeSourceAdapter,
  FixedClock,
  InMemorySnapshotRepository,
  SequentialIdGenerator,
} from './fakes.js';
import { NOW, LATER, artifact, capability, component, discoveredRelease, repository } from './fixtures.js';
import type { CompatibilityRule } from '@compass/domain';
import type { IngestionContext } from '../src/ports/ingestion-context.js';

const RUNTIME_COMPATIBLE_RULE: CompatibilityRule = {
  id: toCompatibilityRuleId('runtime-version-rule'),
  description: 'SDK requires the runtime to satisfy >=2.0.0',
  appliesTo: { componentTypeA: 'sdk', componentTypeB: 'runtime' },
  condition: versionRange('>=2.0.0'),
  conclusion: 'compatible',
  rulePackId: toRulePackId('pack-1'),
};

const sdkRepo = repository('sdk-repo');
const runtimeRepo = repository('runtime-repo');
const sdkComponent = component('sdk-a', 'sdk', sdkRepo.id);
const runtimeComponent = component('runtime-a', 'runtime', runtimeRepo.id);

const sdkRelease1 = discoveredRelease({ id: 'sdk-1.0', componentId: 'sdk-a', version: '1.0.0' });
const runtimeRelease2 = discoveredRelease({ id: 'runtime-2.0', componentId: 'runtime-a', version: '2.0.0' });
const runtimeRelease3 = discoveredRelease({ id: 'runtime-3.0', componentId: 'runtime-a', version: '3.0.0' });

function buildUseCase(
  repo: InMemorySnapshotRepository,
  clock: FixedClock,
  ids: SequentialIdGenerator,
  adapters: { sourceAdapters: FakeSourceAdapter[]; capabilityExtractors: FakeCapabilityExtractor[]; rulePacks: FakeRulePack[] },
): IngestSnapshotUseCase {
  return new IngestSnapshotUseCase({
    sourceAdapters: adapters.sourceAdapters,
    capabilityExtractors: adapters.capabilityExtractors,
    rulePacks: adapters.rulePacks,
    snapshotRepository: repo,
    clock,
    idGenerator: ids,
    versionScheme: semVerScheme,
  });
}

/** Builds the standard "sdk-a 1.0.0 depends on runtime-a >=2.0.0" fixture, with runtime-a 2.0.0 available. */
function firstRunAdapters(): {
  sourceAdapters: FakeSourceAdapter[];
  capabilityExtractors: FakeCapabilityExtractor[];
  rulePacks: FakeRulePack[];
} {
  const sourceAdapter = new FakeSourceAdapter('test-source', () => ({
    repositories: [sdkRepo, runtimeRepo],
    components: [sdkComponent, runtimeComponent],
    releases: [sdkRelease1, runtimeRelease2],
    evidence: [],
  }));

  const capabilityExtractor = new FakeCapabilityExtractor('test-extractor', (context: IngestionContext) => {
    const manifestEvidence = (releaseId: string, seed: string) =>
      createEvidence({
        id: toEvidenceId(`e-${seed}`),
        subject: { kind: 'release', id: releaseId as never },
        sourceType: 'declared-metadata',
        producedBy: 'test-extractor',
        payload: {},
        collectedAt: context.collectedAt,
        snapshotId: context.snapshotId,
      });

    return new Map([
      [
        sdkRelease1.id,
        {
          releaseId: sdkRelease1.id,
          capabilities: [],
          dependencies: [
            { targetComponentId: runtimeComponent.id, constraint: versionRange('>=2.0.0'), kind: 'required' as const },
          ],
          evidence: [manifestEvidence(sdkRelease1.id, 'sdk-manifest')],
        },
      ],
      [
        runtimeRelease2.id,
        {
          releaseId: runtimeRelease2.id,
          capabilities: [capability('zk-proof-v1')],
          dependencies: [],
          evidence: [manifestEvidence(runtimeRelease2.id, 'runtime-2-manifest')],
        },
      ],
    ]);
  });

  const rulePack = new FakeRulePack(toRulePackId('pack-1'), 'test-rules', [RUNTIME_COMPATIBLE_RULE]);

  return { sourceAdapters: [sourceAdapter], capabilityExtractors: [capabilityExtractor], rulePacks: [rulePack] };
}

describe('IngestSnapshotUseCase', () => {
  it('produces a compatible relationship backed by evidence, and a low risk for both components', async () => {
    const repo = new InMemorySnapshotRepository();
    const clock = new FixedClock(NOW);
    const ids = new SequentialIdGenerator();
    const useCase = buildUseCase(repo, clock, ids, firstRunAdapters());

    const snapshot = await useCase.execute();

    expect(snapshot.components).toHaveLength(2);
    expect(snapshot.releases).toHaveLength(2);
    expect(snapshot.compatibilityRelationships).toHaveLength(1);

    const relationship = snapshot.compatibilityRelationships[0];
    expect(relationship?.status).toBe('compatible');
    expect(relationship?.releaseAId).toBe(sdkRelease1.id);
    expect(relationship?.releaseBId).toBe(runtimeRelease2.id);
    expect(relationship?.evidenceIds.length).toBeGreaterThan(0);

    expect(snapshot.breakingChanges).toEqual([]);
    expect(snapshot.risks).toHaveLength(2);
    for (const risk of snapshot.risks) {
      expect(risk.level).toBe('low');
    }
  });

  it('is deterministic: two independent runs with identical inputs and fresh id/clock state produce structurally identical snapshots', async () => {
    const runOnce = async () => {
      const repo = new InMemorySnapshotRepository();
      const clock = new FixedClock(NOW);
      const ids = new SequentialIdGenerator();
      const useCase = buildUseCase(repo, clock, ids, firstRunAdapters());
      return useCase.execute();
    };

    const first = await runOnce();
    const second = await runOnce();

    expect(first).toEqual(second);
  });

  it('detects a breaking change and raises risk when a capability disappears between ingestion runs', async () => {
    const repo = new InMemorySnapshotRepository();
    const clock = new FixedClock(NOW);
    const ids = new SequentialIdGenerator();

    // First run: only runtime 2.0.0 exists, providing zk-proof-v1.
    await buildUseCase(repo, clock, ids, firstRunAdapters()).execute();

    // Second run: the registry now also has runtime 3.0.0, which dropped zk-proof-v1.
    clock.advanceTo(LATER);
    const secondRunSourceAdapter = new FakeSourceAdapter('test-source', () => ({
      repositories: [sdkRepo, runtimeRepo],
      components: [sdkComponent, runtimeComponent],
      releases: [sdkRelease1, runtimeRelease2, runtimeRelease3],
      evidence: [],
    }));
    const secondRunExtractor = new FakeCapabilityExtractor('test-extractor', (context: IngestionContext) => {
      const manifestEvidence = (releaseId: string, seed: string) =>
        createEvidence({
          id: toEvidenceId(`e-${seed}`),
          subject: { kind: 'release', id: releaseId as never },
          sourceType: 'declared-metadata',
          producedBy: 'test-extractor',
          payload: {},
          collectedAt: context.collectedAt,
          snapshotId: context.snapshotId,
        });

      return new Map([
        [
          sdkRelease1.id,
          {
            releaseId: sdkRelease1.id,
            capabilities: [],
            dependencies: [
              { targetComponentId: runtimeComponent.id, constraint: versionRange('>=2.0.0'), kind: 'required' as const },
            ],
            evidence: [manifestEvidence(sdkRelease1.id, 'sdk-manifest-2')],
          },
        ],
        [
          runtimeRelease2.id,
          {
            releaseId: runtimeRelease2.id,
            capabilities: [capability('zk-proof-v1')],
            dependencies: [],
            evidence: [manifestEvidence(runtimeRelease2.id, 'runtime-2-manifest-2')],
          },
        ],
        [
          runtimeRelease3.id,
          {
            releaseId: runtimeRelease3.id,
            capabilities: [capability('zk-proof-v2')],
            dependencies: [],
            evidence: [manifestEvidence(runtimeRelease3.id, 'runtime-3-manifest')],
          },
        ],
      ]);
    });
    const rulePack = new FakeRulePack(toRulePackId('pack-1'), 'test-rules', [RUNTIME_COMPATIBLE_RULE]);

    const secondSnapshot = await buildUseCase(repo, clock, ids, {
      sourceAdapters: [secondRunSourceAdapter],
      capabilityExtractors: [secondRunExtractor],
      rulePacks: [rulePack],
    }).execute();

    expect(secondSnapshot.breakingChanges).toHaveLength(1);
    expect(secondSnapshot.breakingChanges[0]).toMatchObject({
      componentId: runtimeComponent.id,
      fromReleaseId: runtimeRelease2.id,
      toReleaseId: runtimeRelease3.id,
      affectedCapability: 'zk-proof-v1',
    });

    // Two relationships this run: sdk-1 vs runtime-2, and sdk-1 vs runtime-3 — both still compatible.
    expect(secondSnapshot.compatibilityRelationships).toHaveLength(2);
    expect(secondSnapshot.compatibilityRelationships.every((r) => r.status === 'compatible')).toBe(true);

    const runtimeRisk = secondSnapshot.risks.find((risk) =>
      risk.scope.kind === 'component' ? risk.scope.componentId === runtimeComponent.id : false,
    );
    expect(runtimeRisk?.level).toBe('medium');
  });

  it('skips breaking-change detection for a component that is new this run (no prior release to diff against)', async () => {
    const repo = new InMemorySnapshotRepository();
    const clock = new FixedClock(NOW);
    const ids = new SequentialIdGenerator();

    await buildUseCase(repo, clock, ids, firstRunAdapters()).execute();

    clock.advanceTo(LATER);
    const newRepo = repository('new-repo');
    const newComponent = component('brand-new', 'tool', newRepo.id);
    const newRelease = discoveredRelease({ id: 'new-1.0', componentId: 'brand-new', version: '1.0.0' });

    const secondRunSourceAdapter = new FakeSourceAdapter('test-source', () => ({
      repositories: [sdkRepo, runtimeRepo, newRepo],
      components: [sdkComponent, runtimeComponent, newComponent],
      releases: [sdkRelease1, runtimeRelease2, newRelease],
      evidence: [],
    }));
    const rulePack = new FakeRulePack(toRulePackId('pack-1'), 'test-rules', [RUNTIME_COMPATIBLE_RULE]);

    const secondSnapshot = await buildUseCase(repo, clock, ids, {
      sourceAdapters: [secondRunSourceAdapter],
      capabilityExtractors: [new FakeCapabilityExtractor('empty', () => new Map())],
      rulePacks: [rulePack],
    }).execute();

    expect(secondSnapshot.breakingChanges).toEqual([]);
  });

  it('keeps the running-latest release when a lower-versioned release is discovered after a higher one', async () => {
    const repo = new InMemorySnapshotRepository();
    const clock = new FixedClock(NOW);
    const ids = new SequentialIdGenerator();

    await buildUseCase(repo, clock, ids, firstRunAdapters()).execute();

    clock.advanceTo(LATER);
    // runtime-3.0 listed *before* runtime-2.0 this run, to exercise the "keep the running latest" branch.
    const secondRunSourceAdapter = new FakeSourceAdapter('test-source', () => ({
      repositories: [sdkRepo, runtimeRepo],
      components: [sdkComponent, runtimeComponent],
      releases: [runtimeRelease3, sdkRelease1, runtimeRelease2],
      evidence: [],
    }));
    const extractor = new FakeCapabilityExtractor('test-extractor', () => new Map([
      [runtimeRelease3.id, { releaseId: runtimeRelease3.id, capabilities: [capability('zk-proof-v2')], dependencies: [], evidence: [] }],
      [runtimeRelease2.id, { releaseId: runtimeRelease2.id, capabilities: [capability('zk-proof-v1')], dependencies: [], evidence: [] }],
      [
        sdkRelease1.id,
        {
          releaseId: sdkRelease1.id,
          capabilities: [],
          dependencies: [{ targetComponentId: runtimeComponent.id, constraint: versionRange('>=2.0.0'), kind: 'required' as const }],
          evidence: [],
        },
      ],
    ]));
    const rulePack = new FakeRulePack(toRulePackId('pack-1'), 'test-rules', [RUNTIME_COMPATIBLE_RULE]);

    const secondSnapshot = await buildUseCase(repo, clock, ids, {
      sourceAdapters: [secondRunSourceAdapter],
      capabilityExtractors: [extractor],
      rulePacks: [rulePack],
    }).execute();

    // Breaking change is still computed against 3.0.0 (the true latest), regardless of discovery order.
    expect(secondSnapshot.breakingChanges).toHaveLength(1);
    expect(secondSnapshot.breakingChanges[0]?.toReleaseId).toBe(runtimeRelease3.id);
  });

  it('throws NotFoundError when a release exists for a component the source adapter never reported (inconsistent plugin data)', async () => {
    const repo = new InMemorySnapshotRepository();
    const clock = new FixedClock(NOW);
    const ids = new SequentialIdGenerator();

    // runtimeRelease2 is discovered (so it becomes a valid dependency target), but runtimeComponent
    // itself is deliberately omitted from `components` — simulating a plugin bug where a release
    // references a component the plugin never actually reported.
    const sourceAdapter = new FakeSourceAdapter('test-source', () => ({
      repositories: [sdkRepo, runtimeRepo],
      components: [sdkComponent],
      releases: [sdkRelease1, runtimeRelease2],
      evidence: [],
    }));
    const capabilityExtractor = new FakeCapabilityExtractor('test-extractor', () => new Map([
      [
        sdkRelease1.id,
        {
          releaseId: sdkRelease1.id,
          capabilities: [],
          dependencies: [{ targetComponentId: runtimeComponent.id, constraint: versionRange('>=2.0.0'), kind: 'required' as const }],
          evidence: [],
        },
      ],
    ]));

    const useCase = buildUseCase(repo, clock, ids, {
      sourceAdapters: [sourceAdapter],
      capabilityExtractors: [capabilityExtractor],
      rulePacks: [],
    });

    await expect(useCase.execute()).rejects.toThrow(/Component/);
  });

  it('carries discovered artifacts through to the release\'s artifactIds', async () => {
    const repo = new InMemorySnapshotRepository();
    const clock = new FixedClock(NOW);
    const ids = new SequentialIdGenerator();

    const pkg = artifact('pkg-runtime-2.0', runtimeRelease2.id);
    const sourceAdapter = new FakeSourceAdapter('test-source', () => ({
      repositories: [sdkRepo, runtimeRepo],
      components: [sdkComponent, runtimeComponent],
      releases: [sdkRelease1, { ...runtimeRelease2, artifacts: [pkg] }],
      evidence: [],
    }));

    const useCase = buildUseCase(repo, clock, ids, {
      sourceAdapters: [sourceAdapter],
      capabilityExtractors: [],
      rulePacks: [],
    });

    const snapshot = await useCase.execute();
    const release = snapshot.releases.find((r) => r.id === runtimeRelease2.id);
    expect(release?.artifactIds).toEqual([pkg.id]);
    expect(snapshot.artifacts).toEqual([pkg]);
  });

  it('resolves to "unverified" for a dependency edge when no rule fires', async () => {
    const repo = new InMemorySnapshotRepository();
    const clock = new FixedClock(NOW);
    const ids = new SequentialIdGenerator();

    const sourceAdapter = new FakeSourceAdapter('test-source', () => ({
      repositories: [sdkRepo, runtimeRepo],
      components: [sdkComponent, runtimeComponent],
      releases: [sdkRelease1, runtimeRelease2],
      evidence: [],
    }));
    const capabilityExtractor = new FakeCapabilityExtractor('test-extractor', () => new Map([
      [
        sdkRelease1.id,
        {
          releaseId: sdkRelease1.id,
          capabilities: [],
          dependencies: [
            { targetComponentId: runtimeComponent.id, constraint: versionRange('>=2.0.0'), kind: 'required' as const },
          ],
          evidence: [],
        },
      ],
    ]));
    // No rule pack registered at all — nothing can ever fire.
    const useCase = buildUseCase(repo, clock, ids, {
      sourceAdapters: [sourceAdapter],
      capabilityExtractors: [capabilityExtractor],
      rulePacks: [],
    });

    const snapshot = await useCase.execute();
    expect(snapshot.compatibilityRelationships).toHaveLength(1);
    expect(snapshot.compatibilityRelationships[0]?.status).toBe('unverified');
  });

  it('produces no risk entries when a component has no relationships or breaking changes at all', async () => {
    const repo = new InMemorySnapshotRepository();
    const clock = new FixedClock(NOW);
    const ids = new SequentialIdGenerator();

    const standaloneRepo = repository('standalone-repo');
    const standaloneComponent = component('standalone', 'tool', standaloneRepo.id);
    const standaloneRelease = discoveredRelease({ id: 'standalone-1.0', componentId: 'standalone', version: '1.0.0' });

    const sourceAdapter = new FakeSourceAdapter('test-source', () => ({
      repositories: [standaloneRepo],
      components: [standaloneComponent],
      releases: [standaloneRelease],
      evidence: [],
    }));

    const useCase = buildUseCase(repo, clock, ids, {
      sourceAdapters: [sourceAdapter],
      capabilityExtractors: [],
      rulePacks: [],
    });

    const snapshot = await useCase.execute();
    expect(snapshot.compatibilityRelationships).toEqual([]);
    expect(snapshot.risks).toEqual([]);
  });
});
