/** `forge-midnight breaking-changes` — the Breaking Change Analyzer: compares one component's latest release across two persisted snapshots (requires a `--db` with at least two prior `analyze` runs). */
import { toComponentId, toSnapshotId } from '@compass/domain';
import { renderBreakingChangeReportMarkdown } from '@compass/reporting';
import type { AnalyzeBreakingChangeImpactUseCase } from '@compass/application';
import type { SnapshotRepositoryPort } from '@compass/storage-sdk';
import { CliToolError } from '../errors.js';
import type { CommandResult } from './command-result.js';

export interface BreakingChangesDependencies {
  readonly analyzeBreakingChangeImpact: AnalyzeBreakingChangeImpactUseCase;
  readonly snapshotRepository: SnapshotRepositoryPort;
}

export interface BreakingChangesOptions {
  readonly componentId: string;
  readonly fromSnapshotId: string;
  readonly toSnapshotId: string;
}

export async function runBreakingChanges(
  deps: BreakingChangesDependencies,
  options: BreakingChangesOptions,
): Promise<CommandResult> {
  if (!options.componentId || !options.fromSnapshotId || !options.toSnapshotId) {
    throw new CliToolError('breaking-changes requires --component <id>, --from <snapshotId>, and --to <snapshotId>.');
  }

  const toSnapshot = await deps.snapshotRepository.getById(toSnapshotId(options.toSnapshotId));
  if (!toSnapshot) {
    throw new CliToolError(`No snapshot found with id "${options.toSnapshotId}". Run "analyze --db <path>" to record snapshot history first.`);
  }

  const report = await deps.analyzeBreakingChangeImpact.execute({
    componentId: toComponentId(options.componentId),
    fromSnapshotId: toSnapshotId(options.fromSnapshotId),
    toSnapshotId: toSnapshotId(options.toSnapshotId),
  });

  const output = renderBreakingChangeReportMarkdown(report, toSnapshot.components);
  const exitCode = report.removedCapabilities.length > 0 ? 1 : 0;

  return { output, exitCode };
}
