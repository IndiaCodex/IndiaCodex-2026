/**
 * The Compatibility Matrix is a view over already-computed Compatibility
 * Relationships — it introduces no new evaluation logic of its own (see
 * docs/architecture/api-contracts.md#compatibility-matrix). Two shapes are
 * provided: a component-by-component grid (the classic "matrix"), and a
 * whole-stack check (given an exact combination of releases, is the
 * combination viable) — the shape a developer actually asks about when
 * they name a specific stack ("repo A v1.4 + SDK v5 + runtime v3").
 *
 * Both aggregate multiple relationships with the same worst-wins
 * precedence used everywhere else in this engine: "incompatible" beats
 * "unverified" beats "compatible" — one confirmed problem outweighs any
 * number of things that are merely fine or merely unknown.
 */
import type { CompatibilityRelationshipId, ComponentId, ReleaseId } from './ids.js';
import type { CompatibilityRelationship, CompatibilityStatus } from './compatibility-relationship.js';
import type { Release } from './release.js';

const STATUS_SEVERITY: Record<CompatibilityStatus, number> = {
  compatible: 0,
  unverified: 1,
  incompatible: 2,
};

/** The worse of two statuses, where "incompatible" > "unverified" > "compatible". */
export function worseStatus(a: CompatibilityStatus, b: CompatibilityStatus): CompatibilityStatus {
  return STATUS_SEVERITY[a] >= STATUS_SEVERITY[b] ? a : b;
}

export interface CompatibilityMatrixCell {
  readonly componentAId: ComponentId;
  readonly componentBId: ComponentId;
  readonly status: CompatibilityStatus;
  readonly relationshipIds: readonly CompatibilityRelationshipId[];
}

export interface CompatibilityMatrix {
  readonly componentIds: readonly ComponentId[];
  readonly cells: readonly CompatibilityMatrixCell[];
}

/**
 * Builds a component-by-component grid: one cell per (componentA,
 * componentB) pair that has at least one release-level relationship
 * between them, aggregated to the worst status among the releases
 * evaluated. Directional — componentA is the dependent, componentB is the
 * dependency — matching how the underlying relationships were evaluated.
 */
export function buildCompatibilityMatrixView(
  relationships: readonly CompatibilityRelationship[],
  releases: readonly Release[],
): CompatibilityMatrix {
  const componentByRelease = new Map(releases.map((release) => [release.id, release.componentId]));
  const cellsByKey = new Map<string, { componentAId: ComponentId; componentBId: ComponentId; relationshipIds: CompatibilityRelationshipId[]; status: CompatibilityStatus }>();
  const componentIds = new Set<ComponentId>();

  for (const relationship of relationships) {
    const componentAId = componentByRelease.get(relationship.releaseAId);
    const componentBId = componentByRelease.get(relationship.releaseBId);
    if (!componentAId || !componentBId) continue;

    componentIds.add(componentAId);
    componentIds.add(componentBId);

    const key = `${componentAId}->${componentBId}`;
    const existing = cellsByKey.get(key);
    if (existing) {
      existing.relationshipIds.push(relationship.id);
      existing.status = worseStatus(existing.status, relationship.status);
    } else {
      cellsByKey.set(key, {
        componentAId,
        componentBId,
        relationshipIds: [relationship.id],
        status: relationship.status,
      });
    }
  }

  return {
    componentIds: [...componentIds],
    cells: [...cellsByKey.values()].map((cell) => ({ ...cell, relationshipIds: [...cell.relationshipIds] })),
  };
}

export interface StackCompatibilityResult {
  readonly releaseIds: readonly ReleaseId[];
  readonly status: CompatibilityStatus;
  /** Every relationship between two releases in the given stack — the full reasoning trail. */
  readonly contributingRelationships: readonly CompatibilityRelationship[];
}

/**
 * Given an exact combination of releases (e.g. "repo A v1.4 + SDK v5 +
 * runtime v3"), is the combination viable? Aggregates every known
 * relationship between any two releases in the set; a stack with no known
 * relationships between any of its members is "unverified" — Compass has
 * nothing to say about it yet, not a clean bill of health.
 */
export function evaluateStackCompatibility(
  releaseIds: readonly ReleaseId[],
  relationships: readonly CompatibilityRelationship[],
): StackCompatibilityResult {
  const releaseIdSet = new Set(releaseIds);
  const contributingRelationships = relationships.filter(
    (relationship) => releaseIdSet.has(relationship.releaseAId) && releaseIdSet.has(relationship.releaseBId),
  );

  if (contributingRelationships.length === 0) {
    // No known relationship touches this stack at all — Compass has nothing to say about it,
    // which is "unverified", not a clean bill of health.
    return { releaseIds, status: 'unverified', contributingRelationships };
  }

  // Seeded with "compatible" (the best status) so real relationships can only make it worse;
  // seeding with "unverified" would incorrectly outrank a stack whose only relationship is
  // "compatible", since "unverified" is more severe than "compatible" in worseStatus's ordering.
  const status = contributingRelationships.reduce<CompatibilityStatus>(
    (worst, relationship) => worseStatus(worst, relationship.status),
    'compatible',
  );

  return { releaseIds, status, contributingRelationships };
}
