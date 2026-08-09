/** `forge-midnight matrix` — the Compatibility Matrix Generator, rendered from `BuildCompatibilityMatrixUseCase`'s already-computed relationships. */
import { buildCompatibilityMatrixView, toComponentId } from '@compass/domain';
import { renderCompatibilityMatrixHtml, renderCompatibilityMatrixMarkdown } from '@compass/reporting';
import type { BuildCompatibilityMatrixUseCase } from '@compass/application';
import type { CommandResult } from './command-result.js';

export interface MatrixDependencies {
  readonly buildCompatibilityMatrix: BuildCompatibilityMatrixUseCase;
}

export interface MatrixOptions {
  readonly format: 'markdown' | 'html';
  /** Restrict the matrix to these component ids (as printed by `analyze`); omit for the whole ecosystem. */
  readonly componentIds?: readonly string[] | undefined;
}

export async function runMatrix(deps: MatrixDependencies, options: MatrixOptions): Promise<CommandResult> {
  const { snapshot, relationships } = await deps.buildCompatibilityMatrix.execute(
    options.componentIds ? { componentIds: options.componentIds.map((id) => toComponentId(id)) } : {},
  );

  const matrix = buildCompatibilityMatrixView(relationships, snapshot.releases);
  const hasIncompatibility = matrix.cells.some((cell) => cell.status === 'incompatible');

  const output =
    options.format === 'html'
      ? renderCompatibilityMatrixHtml(matrix, snapshot.components)
      : renderCompatibilityMatrixMarkdown(matrix, snapshot.components);

  return { output, exitCode: hasIncompatibility ? 1 : 0 };
}
