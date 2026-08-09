/**
 * Opaque, branded identifier types. Branding prevents a ReleaseId from being
 * passed where a ComponentId is expected even though both are plain strings
 * at runtime — the compiler catches the mix-up that a bare `string` type
 * would let through silently.
 */
declare const brand: unique symbol;
export type Id<Kind extends string> = string & { readonly [brand]: Kind };

function idFactory<Kind extends string>(): (value: string) => Id<Kind> {
  return (value: string): Id<Kind> => {
    if (value.trim() === '') {
      throw new TypeError('An identifier must be a non-empty string.');
    }
    return value as Id<Kind>;
  };
}

export type RepositoryId = Id<'RepositoryId'>;
export const toRepositoryId = idFactory<'RepositoryId'>();

export type ComponentId = Id<'ComponentId'>;
export const toComponentId = idFactory<'ComponentId'>();

export type ReleaseId = Id<'ReleaseId'>;
export const toReleaseId = idFactory<'ReleaseId'>();

export type ArtifactId = Id<'ArtifactId'>;
export const toArtifactId = idFactory<'ArtifactId'>();

export type EvidenceId = Id<'EvidenceId'>;
export const toEvidenceId = idFactory<'EvidenceId'>();

export type CompatibilityRuleId = Id<'CompatibilityRuleId'>;
export const toCompatibilityRuleId = idFactory<'CompatibilityRuleId'>();

export type RulePackId = Id<'RulePackId'>;
export const toRulePackId = idFactory<'RulePackId'>();

export type CompatibilityRelationshipId = Id<'CompatibilityRelationshipId'>;
export const toCompatibilityRelationshipId = idFactory<'CompatibilityRelationshipId'>();

export type BreakingChangeId = Id<'BreakingChangeId'>;
export const toBreakingChangeId = idFactory<'BreakingChangeId'>();

export type RiskId = Id<'RiskId'>;
export const toRiskId = idFactory<'RiskId'>();

export type RecommendationId = Id<'RecommendationId'>;
export const toRecommendationId = idFactory<'RecommendationId'>();

export type SnapshotId = Id<'SnapshotId'>;
export const toSnapshotId = idFactory<'SnapshotId'>();

/**
 * ISO-8601 timestamp, branded to keep it distinct from an arbitrary string.
 * Kept as a string rather than `Date` so every entity remains trivially and
 * losslessly serializable to JSON and to a storage adapter.
 */
export type Timestamp = Id<'Timestamp'>;

export function toTimestamp(isoString: string): Timestamp {
  if (Number.isNaN(Date.parse(isoString))) {
    throw new TypeError(`"${isoString}" is not a valid ISO-8601 timestamp.`);
  }
  return isoString as Timestamp;
}

export function compareTimestamps(a: Timestamp, b: Timestamp): -1 | 0 | 1 {
  const aMs = Date.parse(a);
  const bMs = Date.parse(b);
  if (aMs === bMs) return 0;
  return aMs < bMs ? -1 : 1;
}
