/** Minimal, hand-rolled builders for domain tests — deliberately not the shared @compass/testing
 * package, since that package depends on @compass/domain and must not create a cycle. */
import { semVerScheme } from '../src/version.js';
import type { Capability } from '../src/capability.js';
import type { Component, ComponentType } from '../src/component.js';
import type { Dependency } from '../src/dependency.js';
import type { Release } from '../src/release.js';
import type { Repository } from '../src/repository.js';
import {
  toComponentId,
  toRepositoryId,
  toReleaseId,
  toSnapshotId,
  toTimestamp,
} from '../src/ids.js';

export const NOW = toTimestamp('2026-01-01T00:00:00.000Z');
export const SNAPSHOT_ID = toSnapshotId('snapshot-1');

export function repository(id = 'repo-a'): Repository {
  return { id: toRepositoryId(id), url: `https://example.test/${id}`, hostingPlatform: 'github' };
}

export function component(id: string, type: ComponentType = 'sdk', repositoryId = 'repo-a'): Component {
  return { id: toComponentId(id), name: id, type, repositoryId: toRepositoryId(repositoryId) };
}

export function capability(name: string, version = '1.0.0', direction: 'provided' | 'required' = 'provided'): Capability {
  return { name, version: semVerScheme.parse(version), direction };
}

export function release(input: {
  id: string;
  componentId: string;
  version: string;
  dependencies?: readonly Dependency[];
  capabilities?: readonly Capability[];
}): Release {
  return {
    id: toReleaseId(input.id),
    componentId: toComponentId(input.componentId),
    version: semVerScheme.parse(input.version),
    publishedAt: NOW,
    artifactIds: [],
    dependencies: input.dependencies ?? [],
    capabilities: input.capabilities ?? [],
  };
}
