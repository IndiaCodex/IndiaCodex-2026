/** `forge-midnight dashboard` — generates the static, self-contained HTML dashboard from a fresh snapshot (docs/architecture/interfaces.md#dashboard). */
import { buildCompatibilityMatrixView } from '@compass/domain';
import { renderDashboardHtml } from '@compass/reporting';
import type { IngestSnapshotUseCase } from '@compass/application';
import type { CommandResult } from './command-result.js';

export interface DashboardDependencies {
  readonly ingestSnapshot: IngestSnapshotUseCase;
}

export async function runDashboard(deps: DashboardDependencies): Promise<CommandResult> {
  const snapshot = await deps.ingestSnapshot.execute();
  const matrix = buildCompatibilityMatrixView(snapshot.compatibilityRelationships, snapshot.releases);
  const output = renderDashboardHtml({
    snapshot,
    matrix,
    risks: snapshot.risks,
    generatedAt: snapshot.createdAt,
  });
  return { output, exitCode: 0 };
}
