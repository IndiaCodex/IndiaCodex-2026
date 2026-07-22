import { describe, expect, it } from 'vitest';
import { isPackageArtifact } from '../src/artifact.js';
import { toArtifactId, toReleaseId } from '../src/ids.js';
import type { ArtifactType } from '../src/artifact.js';

function artifactOfType(type: ArtifactType) {
  return { id: toArtifactId('a1'), releaseId: toReleaseId('r1'), type, locator: 'pkg://a1' };
}

describe('isPackageArtifact', () => {
  it('is true for a "package" artifact', () => {
    expect(isPackageArtifact(artifactOfType('package'))).toBe(true);
  });

  it('is false for every other artifact type', () => {
    expect(isPackageArtifact(artifactOfType('binary'))).toBe(false);
    expect(isPackageArtifact(artifactOfType('compiled-contract'))).toBe(false);
    expect(isPackageArtifact(artifactOfType('documentation'))).toBe(false);
    expect(isPackageArtifact(artifactOfType('other'))).toBe(false);
  });
});
