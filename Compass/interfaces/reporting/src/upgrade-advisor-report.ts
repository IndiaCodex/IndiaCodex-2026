/**
 * The Upgrade Advisor Reporter: renders an `UpgradeEvaluation` (the
 * per-stack "is this upgrade safe" answer) and an `UpgradeImpactAnalysis`
 * (the ecosystem-wide "who does this break" answer) as Markdown — see
 * docs/architecture/ecosystem-analysis-algorithms.md#upgrade-advisor.
 */
import { componentName, riskEmoji, riskLabel } from './format-helpers.js';
import type { UpgradeEvaluation, UpgradeImpactAnalysis } from '@compass/application';
import type { Component, RecommendationAction } from '@compass/domain';

const ACTION_LABEL: Record<RecommendationAction, string> = {
  upgrade: '✅ Upgrade',
  avoid: '❌ Avoid',
  hold: '⏸️ Hold',
  'investigate-further': '🔎 Investigate further',
};

export function renderUpgradeEvaluationMarkdown(evaluation: UpgradeEvaluation, components: readonly Component[]): string {
  const subject = componentName(components, evaluation.recommendation.subjectComponentId);
  const lines = [
    `### Upgrade Advisor: ${subject}`,
    '',
    `**Recommendation:** ${ACTION_LABEL[evaluation.recommendation.action]}`,
  ];
  if (evaluation.recommendation.targetReleaseId) {
    lines.push(`**Target release:** \`${evaluation.recommendation.targetReleaseId}\``);
  }
  lines.push(`**Risk:** ${riskEmoji(evaluation.risk.level)} ${riskLabel(evaluation.risk.level)}`);
  lines.push(`**Rationale:** ${evaluation.recommendation.rationale.length} citation(s) — traceable to specific evidence.`);
  return lines.join('\n');
}

export function renderUpgradeImpactMarkdown(analysis: UpgradeImpactAnalysis, components: readonly Component[]): string {
  const lines = [`### Upgrade Impact: moving to \`${analysis.targetReleaseId}\``, ''];

  lines.push('**Blocked (declared constraint violated)**');
  lines.push(
    analysis.blockedComponents.length > 0
      ? analysis.blockedComponents.map((blocked) => `- ${componentName(components, blocked.componentId)}`).join('\n')
      : '_None._',
  );
  lines.push('');

  lines.push('**Compatible**');
  lines.push(
    analysis.compatibleComponentIds.length > 0
      ? analysis.compatibleComponentIds.map((id) => `- ${componentName(components, id)}`).join('\n')
      : '_None._',
  );
  lines.push('');

  lines.push('**Unverified**');
  lines.push(
    analysis.unverifiedComponentIds.length > 0
      ? analysis.unverifiedComponentIds.map((id) => `- ${componentName(components, id)}`).join('\n')
      : '_None._',
  );

  return lines.join('\n');
}
