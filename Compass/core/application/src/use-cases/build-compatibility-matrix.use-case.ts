import { NotFoundError } from '@compass/domain';
import type { ComponentId, CompatibilityRelationship, Snapshot, SnapshotId } from '@compass/domain';
import type { SnapshotRepositoryPort } from '../ports/snapshot-repository.port.js';

export interface BuildCompatibilityMatrixQuery {
  /** Restricts the matrix to relationships touching at least one of these components. Omit for the whole ecosystem. */
  readonly componentIds?: readonly ComponentId[];
  /** Query a specific historical snapshot instead of the latest one (ADR 0007). */
  readonly snapshotId?: SnapshotId;
}

export interface CompatibilityMatrixResult {
  readonly snapshot: Snapshot;
  readonly relationships: readonly CompatibilityRelationship[];
}

/** Serves the Compatibility Matrix query (docs/architecture/api-contracts.md#compatibility-matrix). */
export class BuildCompatibilityMatrixUseCase {
  public constructor(private readonly snapshotRepository: SnapshotRepositoryPort) {}

  public async execute(query: BuildCompatibilityMatrixQuery = {}): Promise<CompatibilityMatrixResult> {
    const snapshot = query.snapshotId
      ? await this.snapshotRepository.getById(query.snapshotId)
      : await this.snapshotRepository.getLatest();

    if (!snapshot) {
      throw new NotFoundError('Snapshot', query.snapshotId ?? '(latest)');
    }

    if (!query.componentIds || query.componentIds.length === 0) {
      return { snapshot, relationships: snapshot.compatibilityRelationships };
    }

    // query.componentIds is narrowed to a non-empty array by the guard above.
    const componentIds = query.componentIds;
    const releaseIdsInScope = new Set(
      snapshot.releases.filter((release) => componentIds.includes(release.componentId)).map((release) => release.id),
    );

    const relationships = snapshot.compatibilityRelationships.filter(
      (relationship) => releaseIdsInScope.has(relationship.releaseAId) || releaseIdsInScope.has(relationship.releaseBId),
    );

    return { snapshot, relationships };
  }
}
