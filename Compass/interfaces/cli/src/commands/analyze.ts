/** `forge-midnight analyze` — ingests a fresh snapshot from the real Midnight ecosystem and summarizes what Compass found. */
import { latestRelease, semVerScheme } from '@compass/domain';
import type { IngestSnapshotUseCase } from '@compass/application';
import type { CommandResult } from './command-result.js';

export interface AnalyzeDependencies {
  readonly ingestSnapshot: IngestSnapshotUseCase;
}

export async function runAnalyze(deps: AnalyzeDependencies): Promise<CommandResult> {
  const snapshot = await deps.ingestSnapshot.execute();
  const lines: string[] = [];

  lines.push(`Snapshot ${snapshot.id} (generated ${snapshot.createdAt})`, '');
  lines.push(`Repositories:               ${snapshot.repositories.length}`);
  lines.push(`Components:                 ${snapshot.components.length}`);
  lines.push(`Releases:                   ${snapshot.releases.length}`);
  lines.push(`Compatibility relationships: ${snapshot.compatibilityRelationships.length}`);
  lines.push(`Breaking changes vs. previous snapshot: ${snapshot.breakingChanges.length}`, '');

  lines.push('Components tracked (id | type -> latest known release):');
  for (const component of snapshot.components) {
    const release = latestRelease(snapshot, component.id, semVerScheme);
    lines.push(
      `  ${component.id} | ${component.type} -> ${release ? `${release.version.raw} [${release.id}]` : '(no releases discovered)'}`,
    );
  }
  lines.push('');

  if (snapshot.risks.length === 0) {
    lines.push('Ecosystem risk: nothing to assess yet — no relationships or breaking changes recorded.');
  } else {
    lines.push('Ecosystem risk:');
    for (const risk of snapshot.risks) {
      const scope = risk.scope.kind === 'component' ? risk.scope.componentId : risk.scope.kind;
      lines.push(`  ${scope}: ${risk.level} (${risk.contributingFactors.length} contributing factor(s))`);
    }
  }

  return { output: lines.join('\n'), exitCode: 0 };
}
