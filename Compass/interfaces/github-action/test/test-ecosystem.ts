/**
 * The same deterministic two-component "app-a depends on lib-b for
 * legacy-witness" ecosystem `interfaces/cli/test/test-ecosystem.ts` uses,
 * trimmed to the two use cases `ActionRuntime` actually wires
 * (`ingestSnapshot`, `buildCompatibilityMatrix`). Generation 1 (lib-b
 * 2.0.0) is compatible; generation 2 (lib-b 3.0.0) drops the capability
 * app-a's declared dependency requires, giving `run()`'s tests a real
 * incompatible relationship to report on.
 */
import {
  createEvidence,
  requiresCapability,
  semVerScheme,
  toComponentId,
  toEvidenceId,
  toRepositoryId,
  toSnapshotId,
  toTimestamp,
} from '@compass/domain';
import { BuildCompatibilityMatrixUseCase, IngestSnapshotUseCase } from '@compass/application';
import { buildComponent, buildRepository } from '@compass/testing';
import {
  FakeCapabilityExtractor,
  FakeRulePack,
  FakeSourceAdapter,
  FixedClock,
  InMemorySnapshotRepository,
  SequentialIdGenerator,
} from '@compass/testing';
import { toReleaseId, toRulePackId } from '@compass/domain';
import type { Timestamp } from '@compass/domain';
import type { ActionRuntime } from '../src/composition-root.js';

export const NOW = toTimestamp('2026-01-01T00:00:00.000Z');
export const LATER = toTimestamp('2026-02-01T00:00:00.000Z');

export const APP_REPO = buildRepository({ id: toRepositoryId('org/app-a'), url: 'https://example.test/org/app-a' });
export const LIB_REPO = buildRepository({ id: toRepositoryId('org/lib-b'), url: 'https://example.test/org/lib-b' });
export const APP_COMPONENT = buildComponent({
  id: toComponentId('org/app-a'),
  name: 'app-a',
  type: 'application',
  repositoryId: APP_REPO.id,
});
export const LIB_COMPONENT = buildComponent({
  id: toComponentId('org/lib-b'),
  name: 'lib-b',
  type: 'runtime',
  repositoryId: LIB_REPO.id,
});

export const APP_RELEASE_ID = toReleaseId('org/app-a@1.0.0');
export const LIB_RELEASE_2 = toReleaseId('org/lib-b@2.0.0');
export const LIB_RELEASE_3 = toReleaseId('org/lib-b@3.0.0');

function discoveredRelease(id: string, componentId: string, versionRaw: string, publishedAt: Timestamp) {
  return {
    id: toReleaseId(id),
    componentId: toComponentId(componentId),
    version: semVerScheme.parse(versionRaw),
    publishedAt,
    artifacts: [],
  };
}

const APP_DISCOVERED = discoveredRelease(APP_RELEASE_ID, APP_COMPONENT.id, '1.0.0', NOW);
const LIB_DISCOVERED_V2 = discoveredRelease(LIB_RELEASE_2, LIB_COMPONENT.id, '2.0.0', NOW);
const LIB_DISCOVERED_V3 = discoveredRelease(LIB_RELEASE_3, LIB_COMPONENT.id, '3.0.0', LATER);

function evidence(id: string, releaseId: string, at: Timestamp) {
  return createEvidence({
    id: toEvidenceId(id),
    subject: { kind: 'release', id: toReleaseId(releaseId) },
    sourceType: 'declared-metadata',
    producedBy: 'test-extractor',
    payload: {},
    collectedAt: at,
    snapshotId: toSnapshotId('test-snapshot'),
  });
}

/** Generation 1: lib-b 2.0.0 provides "legacy-witness", satisfying app-a's declared dependency — compatible. */
function generationOneAdapters() {
  const sourceAdapter = new FakeSourceAdapter('test-source', () => ({
    repositories: [APP_REPO, LIB_REPO],
    components: [APP_COMPONENT, LIB_COMPONENT],
    releases: [APP_DISCOVERED, LIB_DISCOVERED_V2],
    evidence: [],
  }));

  const capabilityExtractor = new FakeCapabilityExtractor('test-extractor', () => {
    return new Map([
      [
        APP_DISCOVERED.id,
        {
          releaseId: APP_DISCOVERED.id,
          capabilities: [],
          dependencies: [
            { targetComponentId: LIB_COMPONENT.id, constraint: requiresCapability('legacy-witness'), kind: 'required' as const },
          ],
          evidence: [evidence('e-app-1', APP_DISCOVERED.id, NOW)],
        },
      ],
      [
        LIB_DISCOVERED_V2.id,
        {
          releaseId: LIB_DISCOVERED_V2.id,
          capabilities: [{ name: 'legacy-witness', version: semVerScheme.parse('2.0.0'), direction: 'provided' as const }],
          dependencies: [],
          evidence: [evidence('e-lib-2', LIB_DISCOVERED_V2.id, NOW)],
        },
      ],
    ]);
  });

  return { sourceAdapters: [sourceAdapter], capabilityExtractors: [capabilityExtractor], rulePacks: [new FakeRulePack(toRulePackId('test-pack'), 'test-rules', [])] };
}

/** Generation 2: lib-b 3.0.0 no longer provides "legacy-witness" — app-a's declared dependency is now violated. */
function generationTwoAdapters() {
  const sourceAdapter = new FakeSourceAdapter('test-source', () => ({
    repositories: [APP_REPO, LIB_REPO],
    components: [APP_COMPONENT, LIB_COMPONENT],
    releases: [APP_DISCOVERED, LIB_DISCOVERED_V3],
    evidence: [],
  }));

  const capabilityExtractor = new FakeCapabilityExtractor('test-extractor', () => {
    return new Map([
      [
        APP_DISCOVERED.id,
        {
          releaseId: APP_DISCOVERED.id,
          capabilities: [],
          dependencies: [
            { targetComponentId: LIB_COMPONENT.id, constraint: requiresCapability('legacy-witness'), kind: 'required' as const },
          ],
          evidence: [evidence('e-app-2', APP_DISCOVERED.id, LATER)],
        },
      ],
      [
        LIB_DISCOVERED_V3.id,
        {
          releaseId: LIB_DISCOVERED_V3.id,
          capabilities: [],
          dependencies: [],
          evidence: [evidence('e-lib-3', LIB_DISCOVERED_V3.id, LATER)],
        },
      ],
    ]);
  });

  return { sourceAdapters: [sourceAdapter], capabilityExtractors: [capabilityExtractor], rulePacks: [new FakeRulePack(toRulePackId('test-pack'), 'test-rules', [])] };
}

export function buildCompatibleActionRuntime(): ActionRuntime {
  const repo = new InMemorySnapshotRepository();
  const clock = new FixedClock(NOW);
  const ids = new SequentialIdGenerator();
  return {
    ingestSnapshot: new IngestSnapshotUseCase({
      ...generationOneAdapters(),
      snapshotRepository: repo,
      clock,
      idGenerator: ids,
      versionScheme: semVerScheme,
    }),
    buildCompatibilityMatrix: new BuildCompatibilityMatrixUseCase(repo),
  };
}

export function buildIncompatibleActionRuntime(): ActionRuntime {
  const repo = new InMemorySnapshotRepository();
  const clock = new FixedClock(LATER);
  const ids = new SequentialIdGenerator();
  return {
    ingestSnapshot: new IngestSnapshotUseCase({
      ...generationTwoAdapters(),
      snapshotRepository: repo,
      clock,
      idGenerator: ids,
      versionScheme: semVerScheme,
    }),
    buildCompatibilityMatrix: new BuildCompatibilityMatrixUseCase(repo),
  };
}
