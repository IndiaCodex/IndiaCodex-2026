/**
 * The CLI's composition root (docs/architecture/interfaces.md#shared-discipline):
 * the one place that decides which plugin and which storage adapter back
 * this run. Nothing outside this file knows a concrete plugin or storage
 * adapter exists — every command depends only on the `CompassRuntime`
 * shape below, built entirely from `@compass/application` use cases.
 */
import {
  AnalyzeBreakingChangeImpactUseCase,
  AnalyzeUpgradeImpactUseCase,
  BuildCompatibilityMatrixUseCase,
  EvaluateUpgradeUseCase,
  IngestSnapshotUseCase,
} from '@compass/application';
import { semVerScheme } from '@compass/domain';
import {
  CompactToolchainCapabilityExtractor,
  MidnightRulePack,
  MidnightSourceAdapter,
  NpmManifestCapabilityExtractor,
  RestGitHubClient,
} from '@compass/plugin-midnight';
import { MemorySnapshotRepository } from '@compass/storage-memory';
import { SqliteSnapshotRepository } from '@compass/storage-sqlite';
import type { SnapshotRepositoryPort } from '@compass/storage-sdk';
import { SystemClock } from './system-clock.js';
import { UuidIdGenerator } from './uuid-id-generator.js';

export interface CompassRuntime {
  readonly snapshotRepository: SnapshotRepositoryPort;
  readonly ingestSnapshot: IngestSnapshotUseCase;
  readonly buildCompatibilityMatrix: BuildCompatibilityMatrixUseCase;
  readonly evaluateUpgrade: EvaluateUpgradeUseCase;
  readonly analyzeUpgradeImpact: AnalyzeUpgradeImpactUseCase;
  readonly analyzeBreakingChangeImpact: AnalyzeBreakingChangeImpactUseCase;
}

export interface CompassRuntimeOptions {
  /** A SQLite file to persist snapshot history in; omit (or pass undefined) for an ephemeral, in-process-only run. */
  readonly dbPath?: string | undefined;
  /** A GitHub personal access token, raises the unauthenticated API rate limit. Never logged. */
  readonly githubToken?: string | undefined;
}

/** Wires the real Midnight plugin and a concrete storage adapter behind the generic ports every use case depends on. */
export function createCompassRuntime(options: CompassRuntimeOptions = {}): CompassRuntime {
  const snapshotRepository: SnapshotRepositoryPort = options.dbPath
    ? new SqliteSnapshotRepository(options.dbPath)
    : new MemorySnapshotRepository();

  const githubClient = new RestGitHubClient(options.githubToken);
  const clock = new SystemClock();
  const idGenerator = new UuidIdGenerator();

  const ingestSnapshot = new IngestSnapshotUseCase({
    sourceAdapters: [new MidnightSourceAdapter(githubClient)],
    capabilityExtractors: [
      new NpmManifestCapabilityExtractor(githubClient),
      new CompactToolchainCapabilityExtractor(githubClient),
    ],
    rulePacks: [new MidnightRulePack()],
    snapshotRepository,
    clock,
    idGenerator,
    versionScheme: semVerScheme,
  });

  return {
    snapshotRepository,
    ingestSnapshot,
    buildCompatibilityMatrix: new BuildCompatibilityMatrixUseCase(snapshotRepository),
    evaluateUpgrade: new EvaluateUpgradeUseCase(snapshotRepository, idGenerator, semVerScheme),
    analyzeUpgradeImpact: new AnalyzeUpgradeImpactUseCase(snapshotRepository, semVerScheme),
    analyzeBreakingChangeImpact: new AnalyzeBreakingChangeImpactUseCase(snapshotRepository, idGenerator, semVerScheme),
  };
}
