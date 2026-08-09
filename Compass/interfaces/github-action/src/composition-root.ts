/**
 * The Action's composition root (docs/architecture/interfaces.md#shared-discipline)
 * — its own, independent from the CLI's, exactly as "each interface owns
 * exactly one composition root" requires. Only the two use cases a PR
 * comment needs are wired here; nothing about the Upgrade Advisor or
 * Breaking Change Analyzer belongs on this surface.
 */
import { BuildCompatibilityMatrixUseCase, IngestSnapshotUseCase } from '@compass/application';
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

export interface ActionRuntime {
  readonly ingestSnapshot: IngestSnapshotUseCase;
  readonly buildCompatibilityMatrix: BuildCompatibilityMatrixUseCase;
}

export interface ActionRuntimeOptions {
  /** A SQLite file to persist snapshot history in; omit (or pass undefined) for an ephemeral, run-scoped snapshot. */
  readonly dbPath?: string | undefined;
  /** A GitHub personal access token for the ingestion source adapter, raises the unauthenticated API rate limit. Never logged. */
  readonly githubToken?: string | undefined;
}

export function createActionRuntime(options: ActionRuntimeOptions = {}): ActionRuntime {
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
    ingestSnapshot,
    buildCompatibilityMatrix: new BuildCompatibilityMatrixUseCase(snapshotRepository),
  };
}
