/** `forge-midnight compatibility` — the Upgrade Advisor: is a specific stack safe to move to a target release, and who else in the ecosystem does that target break. */
import { toComponentId, toReleaseId } from '@compass/domain';
import { renderUpgradeEvaluationMarkdown, renderUpgradeImpactMarkdown } from '@compass/reporting';
import type { AnalyzeUpgradeImpactUseCase, BuildCompatibilityMatrixUseCase, EvaluateUpgradeUseCase } from '@compass/application';
import { CliToolError } from '../errors.js';
import type { CommandResult } from './command-result.js';

export interface CompatibilityDependencies {
  readonly evaluateUpgrade: EvaluateUpgradeUseCase;
  readonly analyzeUpgradeImpact: AnalyzeUpgradeImpactUseCase;
  readonly buildCompatibilityMatrix: BuildCompatibilityMatrixUseCase;
}

export interface CompatibilityOptions {
  readonly targetReleaseId: string;
  /** The component the upgrade is for; required together with `stackReleaseIds` to also evaluate a specific stack. */
  readonly subjectComponentId?: string | undefined;
  readonly stackReleaseIds?: readonly string[] | undefined;
}

export async function runCompatibility(deps: CompatibilityDependencies, options: CompatibilityOptions): Promise<CommandResult> {
  if (!options.targetReleaseId) {
    throw new CliToolError('compatibility requires --target <releaseId>.');
  }

  const targetReleaseId = toReleaseId(options.targetReleaseId);
  const { snapshot } = await deps.buildCompatibilityMatrix.execute();
  const sections: string[] = [];
  let exitCode = 0;

  if (options.subjectComponentId) {
    const evaluation = await deps.evaluateUpgrade.execute({
      subjectComponentId: toComponentId(options.subjectComponentId),
      currentStackReleaseIds: (options.stackReleaseIds ?? []).map((id) => toReleaseId(id)),
      targetReleaseId,
    });
    sections.push(renderUpgradeEvaluationMarkdown(evaluation, snapshot.components));
    if (evaluation.recommendation.action === 'avoid') exitCode = 1;
  }

  const impact = await deps.analyzeUpgradeImpact.execute({ targetReleaseId });
  sections.push(renderUpgradeImpactMarkdown(impact, snapshot.components));
  if (impact.blockedComponents.length > 0) exitCode = 1;

  return { output: sections.join('\n\n'), exitCode };
}
