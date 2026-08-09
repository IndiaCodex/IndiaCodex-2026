/**
 * The Knowledge Graph is not a graph database — it is the logical query
 * facade over a Snapshot's already-loaded data
 * (docs/architecture/knowledge-graph.md). Every function here is pure and
 * synchronous: no I/O, because a Snapshot is always fully materialized in
 * memory by the time anything in this module touches it.
 */
import type { Artifact } from './artifact.js';
import type { BreakingChange } from './breaking-change.js';
import type { Component } from './component.js';
import type { CompatibilityRelationship } from './compatibility-relationship.js';
import type { Evidence } from './evidence.js';
import type { ComponentId, EvidenceId, ReleaseId } from './ids.js';
import type { Release } from './release.js';
import type { Snapshot } from './snapshot.js';
import type { VersionScheme } from './version.js';

export function findComponent(snapshot: Snapshot, id: ComponentId): Component | undefined {
  return snapshot.components.find((component) => component.id === id);
}

export function findRelease(snapshot: Snapshot, id: ReleaseId): Release | undefined {
  return snapshot.releases.find((release) => release.id === id);
}

export function releasesOfComponent(snapshot: Snapshot, componentId: ComponentId): readonly Release[] {
  return snapshot.releases.filter((release) => release.componentId === componentId);
}

export function artifactsOfRelease(snapshot: Snapshot, releaseId: ReleaseId): readonly Artifact[] {
  return snapshot.artifacts.filter((artifact) => artifact.releaseId === releaseId);
}

export function latestRelease(
  snapshot: Snapshot,
  componentId: ComponentId,
  scheme: VersionScheme,
): Release | undefined {
  return releasesOfComponent(snapshot, componentId).reduce<Release | undefined>((latest, candidate) => {
    if (!latest) return candidate;
    return scheme.compare(candidate.version, latest.version) > 0 ? candidate : latest;
  }, undefined);
}

export function evidenceByIds(snapshot: Snapshot, ids: readonly EvidenceId[]): readonly Evidence[] {
  const idSet = new Set(ids);
  return snapshot.evidence.filter((item) => idSet.has(item.id));
}

export function relationshipsInvolvingRelease(
  snapshot: Snapshot,
  releaseId: ReleaseId,
): readonly CompatibilityRelationship[] {
  return snapshot.compatibilityRelationships.filter(
    (relationship) => relationship.releaseAId === releaseId || relationship.releaseBId === releaseId,
  );
}

export function relationshipsInvolvingComponent(
  snapshot: Snapshot,
  componentId: ComponentId,
): readonly CompatibilityRelationship[] {
  const releaseIds = new Set(releasesOfComponent(snapshot, componentId).map((release) => release.id));
  return snapshot.compatibilityRelationships.filter(
    (relationship) => releaseIds.has(relationship.releaseAId) || releaseIds.has(relationship.releaseBId),
  );
}

export function breakingChangesForComponent(snapshot: Snapshot, componentId: ComponentId): readonly BreakingChange[] {
  return snapshot.breakingChanges.filter((change) => change.componentId === componentId);
}
