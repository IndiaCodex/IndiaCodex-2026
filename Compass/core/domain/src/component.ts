import type { ComponentId, RepositoryId } from './ids.js';

/**
 * What kind of independently versioned unit a Component is. Rules use this
 * to distinguish "this is an SDK" from "this is a runtime" without
 * special-casing individual component names.
 *
 * Extended for the Midnight integration (Step 3.2) with 'cli', 'library',
 * 'framework', 'contract', and 'documentation' — real, distinct component
 * kinds present in the Midnight ecosystem that the original six values
 * didn't distinguish. This is additive: existing values are unchanged, and
 * the union is expected to keep growing as new ecosystems bring component
 * kinds this model hasn't seen yet (docs/architecture/domain-model.md).
 */
export type ComponentType =
  | 'sdk'
  | 'runtime'
  | 'toolchain'
  | 'application'
  | 'template'
  | 'tool'
  | 'cli'
  | 'library'
  | 'framework'
  | 'contract'
  | 'documentation';

/** An independently versioned, independently released unit of an ecosystem. */
export interface Component {
  readonly id: ComponentId;
  readonly name: string;
  readonly type: ComponentType;
  readonly repositoryId: RepositoryId;
}
