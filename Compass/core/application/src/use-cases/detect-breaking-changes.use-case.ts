import { detectBreakingChanges, NotFoundError } from '@compass/domain';
import type { BreakingChangeCandidate, ComponentId, ReleaseId, Snapshot } from '@compass/domain';
import type { SnapshotRepositoryPort } from '../ports/snapshot-repository.port.js';

export interface DetectBreakingChangesQuery {
  readonly componentId: ComponentId;
  readonly fromReleaseId: ReleaseId;
  readonly toReleaseId: ReleaseId;
}

export interface BreakingChangeReport {
  readonly snapshot: Snapshot;
  /** Breaking changes already recorded in the snapshot for exactly this pair, if ingestion already computed them. */
  readonly recorded: Snapshot['breakingChanges'];
  /** A live re-derivation from the two releases' current capability sets — always present, even if `recorded` is empty. */
  readonly candidates: readonly BreakingChangeCandidate[];
}

/** Serves the Breaking Change Detection query (docs/architecture/api-contracts.md#breaking-change-detection). */
export class DetectBreakingChangesUseCase {
  public constructor(private readonly snapshotRepository: SnapshotRepositoryPort) {}

  public async execute(query: DetectBreakingChangesQuery): Promise<BreakingChangeReport> {
    const snapshot = await this.snapshotRepository.getLatest();
    if (!snapshot) {
      throw new NotFoundError('Snapshot', '(latest)');
    }

    const fromRelease = snapshot.releases.find((release) => release.id === query.fromReleaseId);
    if (!fromRelease) throw new NotFoundError('Release', query.fromReleaseId);
    const toRelease = snapshot.releases.find((release) => release.id === query.toReleaseId);
    if (!toRelease) throw new NotFoundError('Release', query.toReleaseId);

    const recorded = snapshot.breakingChanges.filter(
      (change) =>
        change.componentId === query.componentId &&
        change.fromReleaseId === query.fromReleaseId &&
        change.toReleaseId === query.toReleaseId,
    );

    const candidates = detectBreakingChanges(fromRelease, toRelease);

    return { snapshot, recorded, candidates };
  }
}
