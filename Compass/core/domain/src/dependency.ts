import type { Constraint } from './constraint.js';
import type { ComponentId } from './ids.js';

export type DependencyKind = 'required' | 'optional' | 'peer' | 'dev';

/**
 * A declared edge from a Release to a required Component, expressed as a
 * Constraint. Owned by the Release that declares it — it has no
 * independent lifecycle.
 */
export interface Dependency {
  readonly targetComponentId: ComponentId;
  readonly constraint: Constraint;
  readonly kind: DependencyKind;
}
