import { describe, expect, it } from 'vitest';
import { versionRange } from '../src/constraint.js';
import { findConflictingComponentVersions } from '../src/dependency-conflict.js';
import { semVerScheme } from '../src/version.js';
import { toComponentId } from '../src/ids.js';
import { release } from './fixtures.js';
import type { Dependency } from '../src/dependency.js';

function dependency(targetComponentId: string, range: string): Dependency {
  return { targetComponentId: toComponentId(targetComponentId), constraint: versionRange(range), kind: 'required' };
}

describe('findConflictingComponentVersions', () => {
  it('reports no conflict when only one dependency targets a component', () => {
    const deps = [dependency('sdk', '>=1.0.0')];
    const releases = [release({ id: 'sdk-1', componentId: 'sdk', version: '1.0.0' })];
    expect(findConflictingComponentVersions(deps, releases, semVerScheme)).toEqual([]);
  });

  it('reports no conflict when every dependency on the same target declares the identical constraint', () => {
    const deps = [dependency('sdk', '>=1.0.0'), dependency('sdk', '>=1.0.0')];
    const releases = [release({ id: 'sdk-1', componentId: 'sdk', version: '1.0.0' })];
    expect(findConflictingComponentVersions(deps, releases, semVerScheme)).toEqual([]);
  });

  it('reports no conflict when a single known release satisfies every distinct constraint', () => {
    const deps = [dependency('sdk', '>=1.0.0'), dependency('sdk', '<3.0.0')];
    const releases = [release({ id: 'sdk-1', componentId: 'sdk', version: '2.0.0' })];
    expect(findConflictingComponentVersions(deps, releases, semVerScheme)).toEqual([]);
  });

  it('reports a conflict when no known release satisfies every distinct constraint', () => {
    const deps = [dependency('sdk', '^1.0.0'), dependency('sdk', '^2.0.0')];
    const releases = [
      release({ id: 'sdk-1', componentId: 'sdk', version: '1.5.0' }),
      release({ id: 'sdk-2', componentId: 'sdk', version: '2.5.0' }),
    ];
    const conflicts = findConflictingComponentVersions(deps, releases, semVerScheme);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.targetComponentId).toBe('sdk');
    expect(conflicts[0]?.constraints).toHaveLength(2);
    expect([...(conflicts[0]?.candidateReleaseIds ?? [])].sort()).toEqual(['sdk-1', 'sdk-2'].sort());
  });

  it('does not claim a conflict when there are no known releases of the target at all', () => {
    const deps = [dependency('sdk', '^1.0.0'), dependency('sdk', '^2.0.0')];
    expect(findConflictingComponentVersions(deps, [], semVerScheme)).toEqual([]);
  });

  it('evaluates each target component independently', () => {
    const deps = [dependency('sdk', '^1.0.0'), dependency('sdk', '^2.0.0'), dependency('runtime', '>=1.0.0')];
    const releases = [
      release({ id: 'sdk-1', componentId: 'sdk', version: '1.5.0' }),
      release({ id: 'runtime-1', componentId: 'runtime', version: '1.0.0' }),
    ];
    const conflicts = findConflictingComponentVersions(deps, releases, semVerScheme);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.targetComponentId).toBe('sdk');
  });

  it('is deterministic', () => {
    const deps = [dependency('sdk', '^1.0.0'), dependency('sdk', '^2.0.0')];
    const releases = [release({ id: 'sdk-1', componentId: 'sdk', version: '1.5.0' })];
    const first = findConflictingComponentVersions(deps, releases, semVerScheme);
    const second = findConflictingComponentVersions(deps, releases, semVerScheme);
    expect(first).toEqual(second);
  });
});
