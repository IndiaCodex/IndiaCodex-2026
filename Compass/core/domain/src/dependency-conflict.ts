/**
 * Detects the "multiple incompatible SDKs" / diamond-dependency case: two
 * or more declared Dependencies targeting the same Component with
 * constraints no single known release of that component can satisfy
 * simultaneously. Deterministic and evidence-bound — a target component
 * with no known releases at all is left alone rather than guessed at,
 * consistent with the fail-closed principle governing every other
 * conclusion in this engine (ADR 0006): absence of data is never treated
 * as proof of a problem.
 */
import { evaluateConstraint } from './constraint.js';
import type { ComponentId } from './ids.js';
import type { Constraint } from './constraint.js';
import type { Dependency } from './dependency.js';
import type { Release } from './release.js';
import type { VersionScheme } from './version.js';

export interface DependencyConflict {
  readonly targetComponentId: ComponentId;
  readonly constraints: readonly Constraint[];
  readonly candidateReleaseIds: readonly Release['id'][];
}

function dedupeConstraints(constraints: readonly Constraint[]): readonly Constraint[] {
  const seen = new Map<string, Constraint>();
  for (const constraint of constraints) {
    seen.set(JSON.stringify(constraint), constraint);
  }
  return [...seen.values()];
}

/**
 * `dependencies` is typically every Dependency declared across a stack
 * (e.g. every release in a "declared-stack" Risk scope); `knownReleases`
 * is the full set of releases available to check candidates against
 * (usually a Snapshot's `releases`).
 */
export function findConflictingComponentVersions(
  dependencies: readonly Dependency[],
  knownReleases: readonly Release[],
  versionScheme: VersionScheme,
): readonly DependencyConflict[] {
  const dependenciesByTarget = new Map<ComponentId, Dependency[]>();
  for (const dependency of dependencies) {
    const existing = dependenciesByTarget.get(dependency.targetComponentId);
    if (existing) {
      existing.push(dependency);
    } else {
      dependenciesByTarget.set(dependency.targetComponentId, [dependency]);
    }
  }

  const conflicts: DependencyConflict[] = [];

  for (const [targetComponentId, targetDependencies] of dependenciesByTarget) {
    const distinctConstraints = dedupeConstraints(targetDependencies.map((dependency) => dependency.constraint));
    if (distinctConstraints.length < 2) continue; // every dependent asked for the same thing — no conflict

    const candidateReleases = knownReleases.filter((release) => release.componentId === targetComponentId);
    if (candidateReleases.length === 0) continue; // no known releases to check against — nothing to claim

    const someReleaseSatisfiesEveryConstraint = candidateReleases.some((release) =>
      distinctConstraints.every((constraint) =>
        evaluateConstraint(constraint, { version: release.version, capabilities: release.capabilities }, versionScheme),
      ),
    );

    if (!someReleaseSatisfiesEveryConstraint) {
      conflicts.push({
        targetComponentId,
        constraints: distinctConstraints,
        candidateReleaseIds: candidateReleases.map((release) => release.id),
      });
    }
  }

  return conflicts;
}
