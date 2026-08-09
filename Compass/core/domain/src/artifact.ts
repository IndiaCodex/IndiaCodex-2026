import type { ArtifactId, ReleaseId } from './ids.js';

export type ArtifactType = 'package' | 'binary' | 'compiled-contract' | 'documentation' | 'other';

/** A concrete output a release produced. A "Package" is simply an Artifact of type `package`. */
export interface Artifact {
  readonly id: ArtifactId;
  readonly releaseId: ReleaseId;
  readonly type: ArtifactType;
  readonly locator: string;
}

export function isPackageArtifact(artifact: Artifact): boolean {
  return artifact.type === 'package';
}
