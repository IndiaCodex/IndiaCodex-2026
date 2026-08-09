import { InvalidEntityError } from './errors.js';
import type { EvidenceId, ReleaseId, ComponentId, SnapshotId, Timestamp, CompatibilityRelationshipId } from './ids.js';

/**
 * What kind of fact an Evidence record documents. A closed enum describing
 * *what kind of fact this is*, not a fuzzy numeric confidence score
 * (docs/architecture/compatibility-engine.md#what-evidence-looks-like).
 */
export type EvidenceSourceType =
  | 'declared-metadata'
  | 'observed-result'
  | 'maintainer-declaration'
  | 'community-report';

export type EvidenceSubject =
  | { readonly kind: 'release'; readonly id: ReleaseId }
  | { readonly kind: 'dependency'; readonly releaseId: ReleaseId; readonly targetComponentId: ComponentId }
  | { readonly kind: 'compatibility-relationship'; readonly id: CompatibilityRelationshipId };

/** The atomic unit of provenance. Every conclusion Compass produces must point to at least one of these. */
export interface Evidence {
  readonly id: EvidenceId;
  readonly subject: EvidenceSubject;
  readonly sourceType: EvidenceSourceType;
  readonly producedBy: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly collectedAt: Timestamp;
  readonly snapshotId: SnapshotId;
}

export function createEvidence(input: {
  readonly id: EvidenceId;
  readonly subject: EvidenceSubject;
  readonly sourceType: EvidenceSourceType;
  readonly producedBy: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly collectedAt: Timestamp;
  readonly snapshotId: SnapshotId;
}): Evidence {
  if (input.producedBy.trim() === '') {
    throw new InvalidEntityError(`Evidence ${input.id} must declare a non-empty "producedBy" source identifier.`);
  }
  return { ...input };
}
