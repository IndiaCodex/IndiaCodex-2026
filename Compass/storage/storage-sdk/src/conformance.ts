/**
 * The storage-adapter equivalent of plugin-sdk's conformance checks
 * (docs/architecture/knowledge-graph.md#storage-abstraction): a shared set
 * of assertions every `SnapshotRepositoryPort` implementation must satisfy,
 * so `core/application` can trust *any* registered adapter without
 * special-casing one specifically.
 *
 * Call this against a fresh, disposable repository instance — it saves
 * throwaway snapshots into whatever is passed in.
 */
import { createEmptySnapshot, toSnapshotId, toTimestamp } from '@compass/domain';
import type { SnapshotRepositoryPort } from '@compass/application';

export interface ConformanceViolation {
  readonly rule: string;
  readonly message: string;
}

export async function checkSnapshotRepositoryConformance(
  repository: SnapshotRepositoryPort,
): Promise<readonly ConformanceViolation[]> {
  const violations: ConformanceViolation[] = [];

  const initialLatest = await repository.getLatest();
  if (initialLatest !== null) {
    violations.push({
      rule: 'fresh-repository-has-no-latest',
      message: 'getLatest() on a repository with nothing saved must return null.',
    });
  }

  const missing = await repository.getById(toSnapshotId('conformance-check-nonexistent'));
  if (missing !== null) {
    violations.push({
      rule: 'unknown-id-returns-null',
      message: 'getById() for an id that was never saved must return null, not throw or fabricate a result.',
    });
  }

  const snapshotA = createEmptySnapshot(
    toSnapshotId('conformance-check-a'),
    toTimestamp('2026-06-01T00:00:00.000Z'),
  );
  await repository.save(snapshotA);

  const retrieved = await repository.getById(snapshotA.id);
  if (!retrieved || JSON.stringify(retrieved) !== JSON.stringify(snapshotA)) {
    violations.push({
      rule: 'save-then-get-by-id-round-trips',
      message: 'getById() must return a snapshot deeply equal to what was passed to save().',
    });
  }

  const latestAfterOne = await repository.getLatest();
  if (latestAfterOne?.id !== snapshotA.id) {
    violations.push({
      rule: 'get-latest-returns-most-recently-created',
      message: 'getLatest() must return the snapshot with the most recent createdAt.',
    });
  }

  // An older snapshot, saved *after* the newer one — getLatest() must track createdAt, not save order.
  const snapshotB = createEmptySnapshot(
    toSnapshotId('conformance-check-b'),
    toTimestamp('2025-01-01T00:00:00.000Z'),
  );
  await repository.save(snapshotB);

  const latestAfterOlder = await repository.getLatest();
  if (latestAfterOlder?.id !== snapshotA.id) {
    violations.push({
      rule: 'get-latest-tracks-created-at-not-save-order',
      message: 'Saving an older snapshot after a newer one must not change what getLatest() returns.',
    });
  }

  const listed = await repository.list();
  const listedIds = new Set(listed.map((summary) => summary.id));
  if (!listedIds.has(snapshotA.id) || !listedIds.has(snapshotB.id)) {
    violations.push({
      rule: 'list-includes-every-saved-snapshot',
      message: 'list() with no filter must include every snapshot that has been saved.',
    });
  }

  const filteredBefore = await repository.list({ before: toTimestamp('2025-06-01T00:00:00.000Z') });
  if (!filteredBefore.some((summary) => summary.id === snapshotB.id) || filteredBefore.some((summary) => summary.id === snapshotA.id)) {
    violations.push({
      rule: 'list-before-filter-excludes-snapshots-created-at-or-after-it',
      message: 'list({ before }) must include only snapshots created strictly before the given timestamp.',
    });
  }

  const filteredAfter = await repository.list({ after: toTimestamp('2025-06-01T00:00:00.000Z') });
  if (!filteredAfter.some((summary) => summary.id === snapshotA.id) || filteredAfter.some((summary) => summary.id === snapshotB.id)) {
    violations.push({
      rule: 'list-after-filter-excludes-snapshots-created-at-or-before-it',
      message: 'list({ after }) must include only snapshots created strictly after the given timestamp.',
    });
  }

  return violations;
}
