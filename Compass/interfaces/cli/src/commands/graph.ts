/** `forge-midnight graph` — the Dependency Graph Generator, rendered from the latest snapshot's declared dependency edges. */
import { renderDependencyGraphMermaid, renderDependencyGraphText } from '@compass/reporting';
import type { BuildCompatibilityMatrixUseCase } from '@compass/application';
import type { CommandResult } from './command-result.js';

export interface GraphDependencies {
  readonly buildCompatibilityMatrix: BuildCompatibilityMatrixUseCase;
}

export interface GraphOptions {
  readonly format: 'mermaid' | 'text';
}

export async function runGraph(deps: GraphDependencies, options: GraphOptions): Promise<CommandResult> {
  const { snapshot } = await deps.buildCompatibilityMatrix.execute();
  const output = options.format === 'text' ? renderDependencyGraphText(snapshot) : renderDependencyGraphMermaid(snapshot);
  return { output, exitCode: 0 };
}
