/**
 * The Breaking Change Reporter: renders a `BreakingChangeImpactReport`
 * (docs/architecture/ecosystem-analysis-algorithms.md#breaking-change-analyzer)
 * as Markdown. Every fact rendered here already carries its own evidence
 * trail in the use case's own output; this only formats it for a human.
 */
import { componentName, formatConstraint, riskEmoji, riskLabel } from './format-helpers.js';
import type { BreakingChangeImpactReport } from '@compass/application';
import type { Component } from '@compass/domain';

export function renderBreakingChangeReportMarkdown(
  report: BreakingChangeImpactReport,
  components: readonly Component[],
): string {
  const subject = componentName(components, report.componentId);
  const lines: string[] = [`### Breaking Change Report: ${subject}`, ''];
  lines.push(`Comparing \`${report.fromReleaseId}\` → \`${report.toReleaseId}\``, '');

  lines.push('**Added capabilities**');
  lines.push(report.addedCapabilities.length > 0 ? report.addedCapabilities.map((name) => `- ${name}`).join('\n') : '_None._');
  lines.push('');

  lines.push('**Removed capabilities**');
  lines.push(
    report.removedCapabilities.length > 0
      ? report.removedCapabilities.map((candidate) => `- \`${candidate.affectedCapability}\` — ${candidate.description}`).join('\n')
      : '_None._',
  );
  lines.push('');

  lines.push('**Changed dependency constraints**');
  if (report.changedConstraints.length > 0) {
    lines.push(
      report.changedConstraints
        .map((change) => {
          const target = componentName(components, change.targetComponentId);
          const from = change.from ? formatConstraint(change.from) : '_(none)_';
          const to = change.to ? formatConstraint(change.to) : '_(removed)_';
          return `- **${target}**: \`${from}\` → \`${to}\``;
        })
        .join('\n'),
    );
  } else {
    lines.push('_None._');
  }
  lines.push('');

  lines.push('**Affected components**');
  lines.push(
    report.affectedComponentIds.length > 0
      ? report.affectedComponentIds.map((id) => `- ${componentName(components, id)}`).join('\n')
      : '_None known._',
  );
  lines.push('');

  lines.push(
    report.risk
      ? `**Risk:** ${riskEmoji(report.risk.level)} ${riskLabel(report.risk.level)} (${report.risk.contributingFactors.length} contributing factor(s))`
      : '**Risk:** _Not computed — no known dependents to evaluate._',
  );

  return lines.join('\n');
}
