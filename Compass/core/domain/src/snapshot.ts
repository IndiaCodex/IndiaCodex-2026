import type { Artifact } from './artifact.js';
import type { BreakingChange } from './breaking-change.js';
import type { Component } from './component.js';
import type { CompatibilityRelationship } from './compatibility-relationship.js';
import type { CompatibilityRule } from './compatibility-rule.js';
import type { Evidence } from './evidence.js';
import type { SnapshotId, Timestamp } from './ids.js';
import type { Recommendation } from './recommendation.js';
import type { Release } from './release.js';
import type { Repository } from './repository.js';
import type { Risk } from './risk.js';

/**
 * A complete, immutable, self-consistent state of the Knowledge Graph at a
 * point in time (ADR 0007). Everything the Compatibility Engine, Risk
 * Engine, and Recommendation Engine produce is scoped to one of these.
 */
export interface Snapshot {
  readonly id: SnapshotId;
  readonly createdAt: Timestamp;
  readonly repositories: readonly Repository[];
  readonly components: readonly Component[];
  readonly releases: readonly Release[];
  readonly artifacts: readonly Artifact[];
  readonly evidence: readonly Evidence[];
  readonly compatibilityRules: readonly CompatibilityRule[];
  readonly compatibilityRelationships: readonly CompatibilityRelationship[];
  readonly breakingChanges: readonly BreakingChange[];
  readonly risks: readonly Risk[];
  readonly recommendations: readonly Recommendation[];
}

export function createEmptySnapshot(id: SnapshotId, createdAt: Timestamp): Snapshot {
  return {
    id,
    createdAt,
    repositories: [],
    components: [],
    releases: [],
    artifacts: [],
    evidence: [],
    compatibilityRules: [],
    compatibilityRelationships: [],
    breakingChanges: [],
    risks: [],
    recommendations: [],
  };
}
