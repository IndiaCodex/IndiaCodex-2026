/**
 * Computes a Risk deterministically from a scope's Compatibility
 * Relationships and Breaking Changes. The thresholds below are a
 * deliberately simple, explainable first pass (see docs/architecture/
 * cross-cutting-concerns.md and ADR 0002's rejection of scored/ML-based
 * signals) — not a claim that they're the ecosystem's final tuning. They
 * exist to be checked against real data and revised, in the open, not
 * hidden inside an opaque scoring function.
 */
import { createRisk } from './risk.js';
import type { BreakingChange } from './breaking-change.js';
import type { CompatibilityRelationship } from './compatibility-relationship.js';
import type { Risk, RiskLevel, RiskScope } from './risk.js';
import type { RiskId, SnapshotId } from './ids.js';

export interface RiskComputationInput {
  readonly id: RiskId;
  readonly scope: RiskScope;
  readonly relationships: readonly CompatibilityRelationship[];
  readonly breakingChanges: readonly BreakingChange[];
  readonly snapshotId: SnapshotId;
}

function determineLevel(relationships: readonly CompatibilityRelationship[], breakingChanges: readonly BreakingChange[]): RiskLevel {
  const incompatibleCount = relationships.filter((relationship) => relationship.status === 'incompatible').length;
  const unverifiedCount = relationships.filter((relationship) => relationship.status === 'unverified').length;

  if (incompatibleCount > 0 || breakingChanges.length > 2) {
    return 'high';
  }
  if (breakingChanges.length > 0 || unverifiedCount > 0) {
    return 'medium';
  }
  return 'low';
}

export function computeRisk(input: RiskComputationInput): Risk {
  const level = determineLevel(input.relationships, input.breakingChanges);
  return createRisk({
    id: input.id,
    scope: input.scope,
    level,
    contributingFactors: [
      ...input.relationships.map((relationship) => ({ kind: 'compatibility-relationship' as const, id: relationship.id })),
      ...input.breakingChanges.map((change) => ({ kind: 'breaking-change' as const, id: change.id })),
    ],
    snapshotId: input.snapshotId,
  });
}
