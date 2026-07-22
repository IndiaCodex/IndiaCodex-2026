import { createEvidence, semVerScheme } from '@compass/domain';
import {
  toArtifactId,
  toComponentId,
  toEvidenceId,
  toRepositoryId,
  toReleaseId,
  toSnapshotId,
  toTimestamp,
} from '@compass/domain';
import type { Artifact, Capability, Component, ComponentType, Dependency, Evidence, Release, Repository } from '@compass/domain';
import type { DiscoveredRelease } from '../src/ports/source-adapter.port.js';

export const NOW = toTimestamp('2026-01-01T00:00:00.000Z');
export const LATER = toTimestamp('2026-02-01T00:00:00.000Z');
export const SNAPSHOT_ID = toSnapshotId('snap-1');

export function repository(id: string): Repository {
  return { id: toRepositoryId(id), url: `https://example.test/${id}`, hostingPlatform: 'github' };
}

export function component(id: string, type: ComponentType, repositoryId: string): Component {
  return { id: toComponentId(id), name: id, type, repositoryId: toRepositoryId(repositoryId) };
}

export function capability(name: string, version = '1.0.0', direction: 'provided' | 'required' = 'provided'): Capability {
  return { name, version: semVerScheme.parse(version), direction };
}

export function artifact(id: string, releaseId: string): Artifact {
  return { id: toArtifactId(id), releaseId: toReleaseId(releaseId), type: 'package', locator: `pkg://${id}` };
}

export function discoveredRelease(input: {
  id: string;
  componentId: string;
  version: string;
  publishedAt?: typeof NOW;
  artifacts?: readonly Artifact[];
}): DiscoveredRelease {
  return {
    id: toReleaseId(input.id),
    componentId: toComponentId(input.componentId),
    version: semVerScheme.parse(input.version),
    publishedAt: input.publishedAt ?? NOW,
    artifacts: input.artifacts ?? [],
  };
}

export function release(input: {
  id: string;
  componentId: string;
  version: string;
  publishedAt?: typeof NOW;
  dependencies?: readonly Dependency[];
  capabilities?: readonly Capability[];
}): Release {
  return {
    id: toReleaseId(input.id),
    componentId: toComponentId(input.componentId),
    version: semVerScheme.parse(input.version),
    publishedAt: input.publishedAt ?? NOW,
    artifactIds: [],
    dependencies: input.dependencies ?? [],
    capabilities: input.capabilities ?? [],
  };
}

export function releaseEvidence(id: string, releaseId: ReturnType<typeof toReleaseId>): Evidence {
  return createEvidence({
    id: toEvidenceId(id),
    subject: { kind: 'release', id: releaseId },
    sourceType: 'declared-metadata',
    producedBy: 'test-fixture',
    payload: {},
    collectedAt: NOW,
    snapshotId: SNAPSHOT_ID,
  });
}
