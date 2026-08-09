/**
 * Builders for every domain entity, each returning a fully valid instance
 * with sensible defaults that satisfy every invariant in
 * docs/architecture/domain-model.md#invariants out of the box — a test
 * only needs to override the fields it actually cares about.
 */
import {
  createBreakingChange,
  createCompatibilityRelationship,
  createEmptySnapshot,
  createEvidence,
  createRecommendation,
  createRisk,
  semVerScheme,
  toArtifactId,
  toBreakingChangeId,
  toCompatibilityRelationshipId,
  toCompatibilityRuleId,
  toComponentId,
  toEvidenceId,
  toRecommendationId,
  toReleaseId,
  toRepositoryId,
  toRiskId,
  toRulePackId,
  toSnapshotId,
  toTimestamp,
} from '@compass/domain';
import { nextSequence } from './sequence.js';
import type {
  Artifact,
  BreakingChange,
  Capability,
  Component,
  ComponentType,
  CompatibilityRelationship,
  CompatibilityRule,
  Dependency,
  Evidence,
  Recommendation,
  Release,
  Repository,
  Risk,
  Snapshot,
} from '@compass/domain';

/** A fixed, deterministic default timestamp — override explicitly whenever a test's behavior depends on time. */
export const DEFAULT_TIMESTAMP = toTimestamp('2026-01-01T00:00:00.000Z');
export const DEFAULT_SNAPSHOT_ID = toSnapshotId('test-snapshot');

export function buildRepository(overrides: Partial<Repository> = {}): Repository {
  const seq = nextSequence();
  return {
    id: toRepositoryId(`repo-${seq}`),
    url: `https://example.test/repo-${seq}`,
    hostingPlatform: 'github',
    ...overrides,
  };
}

export function buildComponent(overrides: Partial<Component> & { type?: ComponentType } = {}): Component {
  const seq = nextSequence();
  return {
    id: toComponentId(`component-${seq}`),
    name: `component-${seq}`,
    type: 'sdk',
    repositoryId: toRepositoryId(`repo-${seq}`),
    ...overrides,
  };
}

export function buildArtifact(overrides: Partial<Artifact> = {}): Artifact {
  const seq = nextSequence();
  return {
    id: toArtifactId(`artifact-${seq}`),
    releaseId: toReleaseId(`release-${seq}`),
    type: 'package',
    locator: `pkg://artifact-${seq}`,
    ...overrides,
  };
}

export function buildCapability(overrides: Partial<Capability> = {}): Capability {
  return {
    name: `capability-${nextSequence()}`,
    version: semVerScheme.parse('1.0.0'),
    direction: 'provided',
    ...overrides,
  };
}

export function buildDependency(overrides: Partial<Dependency> = {}): Dependency {
  return {
    targetComponentId: toComponentId(`component-${nextSequence()}`),
    constraint: { kind: 'version-range', range: '>=1.0.0' },
    kind: 'required',
    ...overrides,
  };
}

export function buildRelease(overrides: Partial<Release> = {}): Release {
  const seq = nextSequence();
  return {
    id: toReleaseId(`release-${seq}`),
    componentId: toComponentId(`component-${seq}`),
    version: semVerScheme.parse('1.0.0'),
    publishedAt: DEFAULT_TIMESTAMP,
    artifactIds: [],
    dependencies: [],
    capabilities: [],
    ...overrides,
  };
}

export function buildEvidence(overrides: Partial<Evidence> = {}): Evidence {
  const seq = nextSequence();
  return createEvidence({
    id: toEvidenceId(`evidence-${seq}`),
    subject: { kind: 'release', id: toReleaseId(`release-${seq}`) },
    sourceType: 'declared-metadata',
    producedBy: 'test-builder',
    payload: {},
    collectedAt: DEFAULT_TIMESTAMP,
    snapshotId: DEFAULT_SNAPSHOT_ID,
    ...overrides,
  });
}

export function buildCompatibilityRule(overrides: Partial<CompatibilityRule> = {}): CompatibilityRule {
  const seq = nextSequence();
  return {
    id: toCompatibilityRuleId(`rule-${seq}`),
    description: `test rule ${seq}`,
    appliesTo: { componentTypeA: null, componentTypeB: null },
    condition: { kind: 'version-range', range: '>=0.0.0' },
    conclusion: 'compatible',
    rulePackId: toRulePackId(`pack-${seq}`),
    ...overrides,
  };
}

/**
 * Builds a valid CompatibilityRelationship. Defaults to `status: 'unverified'`
 * with no evidence — the only status ADR 0006 allows without one. Pass
 * `status` and `evidenceIds` together for a `'compatible'`/`'incompatible'` result.
 */
export function buildCompatibilityRelationship(
  overrides: Partial<CompatibilityRelationship> = {},
): CompatibilityRelationship {
  const seq = nextSequence();
  return createCompatibilityRelationship({
    id: toCompatibilityRelationshipId(`relationship-${seq}`),
    releaseAId: toReleaseId(`release-a-${seq}`),
    releaseBId: toReleaseId(`release-b-${seq}`),
    status: 'unverified',
    ruleIds: [],
    evidenceIds: [],
    snapshotId: DEFAULT_SNAPSHOT_ID,
    ...overrides,
  });
}

export function buildBreakingChange(
  overrides: Partial<Omit<BreakingChange, 'componentId' | 'fromReleaseId' | 'toReleaseId'>> & {
    fromRelease?: Release;
    toRelease?: Release;
  } = {},
): BreakingChange {
  const { fromRelease, toRelease, ...rest } = overrides;
  const seq = nextSequence();
  const resolvedFrom = fromRelease ?? buildRelease({ version: semVerScheme.parse('1.0.0') });
  const resolvedTo =
    toRelease ?? buildRelease({ componentId: resolvedFrom.componentId, version: semVerScheme.parse('2.0.0') });
  return createBreakingChange({
    id: toBreakingChangeId(`breaking-change-${seq}`),
    fromRelease: resolvedFrom,
    toRelease: resolvedTo,
    affectedCapability: null,
    description: `test breaking change ${seq}`,
    detectedViaEvidenceId: toEvidenceId(`evidence-${seq}`),
    ...rest,
  });
}

/**
 * Builds a valid Risk. Defaults to a single compatibility-relationship
 * contributing factor — ADR 0006 forbids a Risk with none at all.
 */
export function buildRisk(overrides: Partial<Risk> = {}): Risk {
  const seq = nextSequence();
  return createRisk({
    id: toRiskId(`risk-${seq}`),
    scope: { kind: 'component', componentId: toComponentId(`component-${seq}`) },
    level: 'low',
    contributingFactors: [
      { kind: 'compatibility-relationship', id: toCompatibilityRelationshipId(`relationship-${seq}`) },
    ],
    snapshotId: DEFAULT_SNAPSHOT_ID,
    ...overrides,
  });
}

/** Builds a valid Recommendation. Defaults to `action: 'hold'`, the only action that needs no targetReleaseId. */
export function buildRecommendation(overrides: Partial<Recommendation> = {}): Recommendation {
  const seq = nextSequence();
  return createRecommendation({
    id: toRecommendationId(`recommendation-${seq}`),
    subjectComponentId: toComponentId(`component-${seq}`),
    action: 'hold',
    targetReleaseId: null,
    rationale: [{ kind: 'compatibility-relationship', id: toCompatibilityRelationshipId(`relationship-${seq}`) }],
    snapshotId: DEFAULT_SNAPSHOT_ID,
    ...overrides,
  });
}

export function buildSnapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return { ...createEmptySnapshot(DEFAULT_SNAPSHOT_ID, DEFAULT_TIMESTAMP), ...overrides };
}
