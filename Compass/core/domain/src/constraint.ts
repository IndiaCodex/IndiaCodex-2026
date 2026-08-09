import type { Capability } from './capability.js';
import type { Version, VersionScheme } from './version.js';

/**
 * An expression limiting acceptable versions or capabilities — the shared
 * language both `Dependency` declarations and `Compatibility Rule`
 * conditions are built from (docs/architecture/domain-model.md#value-objects).
 *
 * Constraints are plain data, never code — see ADR 0005. `evaluateConstraint`
 * is the only interpreter; there is no other way to act on one.
 */
export type Constraint =
  | { readonly kind: 'version-range'; readonly range: string }
  | { readonly kind: 'capability'; readonly name: string; readonly range: string | null }
  | { readonly kind: 'and'; readonly constraints: readonly Constraint[] }
  | { readonly kind: 'or'; readonly constraints: readonly Constraint[] }
  | { readonly kind: 'not'; readonly constraint: Constraint };

export function versionRange(range: string): Constraint {
  return { kind: 'version-range', range };
}

export function requiresCapability(name: string, range: string | null = null): Constraint {
  return { kind: 'capability', name, range };
}

export function and(...constraints: readonly Constraint[]): Constraint {
  return { kind: 'and', constraints };
}

export function or(...constraints: readonly Constraint[]): Constraint {
  return { kind: 'or', constraints };
}

export function not(constraint: Constraint): Constraint {
  return { kind: 'not', constraint };
}

/** What a Constraint is evaluated against: a release's version and the capabilities it provides. */
export interface ConstraintSubject {
  readonly version: Version;
  readonly capabilities: readonly Capability[];
}

export function evaluateConstraint(constraint: Constraint, subject: ConstraintSubject, scheme: VersionScheme): boolean {
  switch (constraint.kind) {
    case 'version-range':
      return scheme.satisfies(subject.version, constraint.range);
    case 'capability': {
      const provided = subject.capabilities.find(
        (capability) => capability.name === constraint.name && capability.direction === 'provided',
      );
      if (!provided) return false;
      if (constraint.range === null) return true;
      return scheme.satisfies(provided.version, constraint.range);
    }
    case 'and':
      return constraint.constraints.every((child) => evaluateConstraint(child, subject, scheme));
    case 'or':
      return constraint.constraints.some((child) => evaluateConstraint(child, subject, scheme));
    case 'not':
      return !evaluateConstraint(constraint.constraint, subject, scheme);
  }
}
