/**
 * The composite report the GitHub Action posts as a PR comment: an
 * ecosystem health summary, the Compatibility Matrix, and a per-component
 * risk breakdown, all built from data the same use cases the CLI calls
 * already produced. `renderPrComment` is the one place this shape is
 * assembled, so the Action's comment and (if a maintainer ever wants it)
 * a CLI `analyze` summary can never drift apart.
 */
import { renderCompatibilityMatrixMarkdown } from './matrix-report.js';
import { riskEmoji, riskLabel } from './format-helpers.js';
import type { Component, CompatibilityMatrix, Risk } from '@compass/domain';

/**
 * A stable HTML comment marker so the GitHub Action can find and update its
 * own prior comment on subsequent pushes, instead of posting a new one
 * every run (docs/architecture/interfaces.md#github-action).
 */
export const PR_COMMENT_MARKER = '<!-- forge-midnight:compatibility-report -->';

export interface PrCommentInput {
  readonly components: readonly Component[];
  readonly matrix: CompatibilityMatrix;
  readonly risks: readonly Risk[];
  readonly generatedAt: string;
}

export interface PrCommentResult {
  readonly markdown: string;
  /** True when any relationship in the matrix is incompatible — what the Action uses to decide the check's pass/fail status. */
  readonly hasIncompatibility: boolean;
}

export function renderPrComment(input: PrCommentInput): PrCommentResult {
  const hasIncompatibility = input.matrix.cells.some((cell) => cell.status === 'incompatible');
  const hasUnverified = input.matrix.cells.some((cell) => cell.status === 'unverified');

  const statusLine = hasIncompatibility
    ? '❌ **Incompatibilities found** — see below.'
    : hasUnverified
      ? '❓ **No incompatibilities found**, but some relationships are unverified.'
      : '✅ **No known incompatibilities.**';

  const riskLines =
    input.risks.length > 0
      ? input.risks
          .map((risk) => {
            const scopeLabel = risk.scope.kind === 'component' ? risk.scope.componentId : risk.scope.kind;
            return `- ${riskEmoji(risk.level)} **${scopeLabel}** — ${riskLabel(risk.level)} (${risk.contributingFactors.length} contributing factor(s))`;
          })
          .join('\n')
      : '_No components currently have relationships or breaking changes to assess._';

  const markdown = [
    PR_COMMENT_MARKER,
    '## 🧭 Compass Compatibility Report',
    '',
    statusLine,
    '',
    `_Generated ${input.generatedAt}_`,
    '',
    '### Compatibility Matrix',
    '',
    renderCompatibilityMatrixMarkdown(input.matrix, input.components),
    '',
    '### Ecosystem Risk',
    '',
    riskLines,
    '',
    '<sub>Every result above is traceable to specific Evidence recorded during ingestion — see `docs/architecture/compatibility-engine.md` for how conclusions are reached. This report never guesses.</sub>',
  ].join('\n');

  return { markdown, hasIncompatibility };
}
