/**
 * Turns a Compatibility Relationship (and, if available, a Risk) between a
 * component's current stack and a candidate target release into an
 * actionable Recommendation. Pure and deterministic: the same relationship
 * and risk always produce the same recommendation.
 */
import { createRecommendation } from './recommendation.js';
import type { CompatibilityRelationship } from './compatibility-relationship.js';
import type { ComponentId, RecommendationId, SnapshotId } from './ids.js';
import type { Recommendation, RecommendationAction, RecommendationRationale } from './recommendation.js';
import type { Release } from './release.js';
import type { Risk } from './risk.js';

export interface RecommendationInput {
  readonly id: RecommendationId;
  readonly subjectComponentId: ComponentId;
  readonly targetRelease: Release;
  readonly relationship: CompatibilityRelationship;
  readonly risk: Risk | null;
  readonly snapshotId: SnapshotId;
}

function decideAction(relationship: CompatibilityRelationship, risk: Risk | null): RecommendationAction {
  switch (relationship.status) {
    case 'incompatible':
      return 'avoid';
    case 'unverified':
      return 'hold';
    case 'compatible':
      return risk?.level === 'high' ? 'investigate-further' : 'upgrade';
  }
}

export function generateRecommendation(input: RecommendationInput): Recommendation {
  const action = decideAction(input.relationship, input.risk);

  const rationale: RecommendationRationale[] = [
    { kind: 'compatibility-relationship', id: input.relationship.id },
  ];
  if (input.risk) {
    rationale.push({ kind: 'risk', id: input.risk.id });
  }

  return createRecommendation({
    id: input.id,
    subjectComponentId: input.subjectComponentId,
    action,
    targetReleaseId: action === 'upgrade' ? input.targetRelease.id : null,
    rationale,
    snapshotId: input.snapshotId,
  });
}
