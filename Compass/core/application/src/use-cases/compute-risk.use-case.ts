import { computeRisk, NotFoundError, toRiskId } from '@compass/domain';
import type { Risk, RiskScope, Snapshot } from '@compass/domain';
import type { IdGeneratorPort } from '../ports/id-generator.port.js';
import type { SnapshotRepositoryPort } from '../ports/snapshot-repository.port.js';

export interface ComputeRiskQuery {
  readonly scope: RiskScope;
}

function releaseIdsInScope(snapshot: Snapshot, scope: RiskScope): ReadonlySet<Snapshot['releases'][number]['id']> {
  switch (scope.kind) {
    case 'component':
      return new Set(
        snapshot.releases.filter((release) => release.componentId === scope.componentId).map((release) => release.id),
      );
    case 'repository': {
      const componentIds = new Set(
        snapshot.components.filter((component) => component.repositoryId === scope.repositoryId).map((c) => c.id),
      );
      return new Set(
        snapshot.releases.filter((release) => componentIds.has(release.componentId)).map((release) => release.id),
      );
    }
    case 'declared-stack':
      return new Set(scope.releaseIds);
  }
}

/** Serves the Ecosystem / Environment Risk query (docs/architecture/api-contracts.md#ecosystem--environment-risk). */
export class ComputeRiskUseCase {
  public constructor(
    private readonly snapshotRepository: SnapshotRepositoryPort,
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  /**
   * Returns null when the scope has no relationships and no breaking
   * changes to derive a Risk from — a component nobody depends on yet is
   * "nothing to report," not an error, and `computeRisk` correctly refuses
   * to fabricate a Risk with zero contributing factors (ADR 0006).
   */
  public async execute(query: ComputeRiskQuery): Promise<Risk | null> {
    const snapshot = await this.snapshotRepository.getLatest();
    if (!snapshot) {
      throw new NotFoundError('Snapshot', '(latest)');
    }

    const inScope = releaseIdsInScope(snapshot, query.scope);
    const relationships = snapshot.compatibilityRelationships.filter(
      (relationship) => inScope.has(relationship.releaseAId) || inScope.has(relationship.releaseBId),
    );
    const releaseComponentIds = new Set(
      snapshot.releases.filter((release) => inScope.has(release.id)).map((release) => release.componentId),
    );
    const breakingChanges = snapshot.breakingChanges.filter((change) => releaseComponentIds.has(change.componentId));

    if (relationships.length === 0 && breakingChanges.length === 0) {
      return null;
    }

    return computeRisk({
      id: toRiskId(this.idGenerator.next('risk')),
      scope: query.scope,
      relationships,
      breakingChanges,
      snapshotId: snapshot.id,
    });
  }
}
