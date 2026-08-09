import type { ComponentType } from '@compass/domain';

/**
 * Which real Midnight ecosystem repositories this plugin watches, and how
 * to interpret each one — a deliberate, human-declared fact (which repo is
 * an SDK vs. a runtime vs. documentation), never guessed from a
 * description or heuristic (the brief's "no heuristics without evidence").
 * See docs/midnight-plugin.md for the reasoning behind each entry.
 */
export interface MidnightRepositoryConfig {
  readonly owner: string;
  readonly repo: string;
  readonly componentName: string;
  readonly componentType: ComponentType;
  /** GitHub release tag prefix to filter and strip (e.g. "v", "node-", "compactc-v"). Null when the repo has no releases/tags to use. */
  readonly tagPrefix: string | null;
  /** Path to an npm-style manifest to parse for capabilities/dependencies. Null when this repo isn't an npm package. */
  readonly manifestPath: string | null;
  /** The npm package name this component provides, used to resolve other components' declared dependencies onto it. */
  readonly providedPackageName: string | null;
  readonly extractorKind: 'npm-manifest' | 'compact-toolchain-release' | 'none';
  /** Path to a Compact contract source file to parse for `pragma language_version`. Midnight-specific (see capability-extractors.md). */
  readonly contractPath: string | null;
}

export const MIDNIGHT_REPOSITORIES: readonly MidnightRepositoryConfig[] = [
  {
    owner: 'midnightntwrk',
    repo: 'midnight-js',
    componentName: 'midnight-js',
    componentType: 'sdk',
    tagPrefix: 'v',
    manifestPath: 'packages/midnight-js/package.json',
    providedPackageName: '@midnight-ntwrk/midnight-js',
    extractorKind: 'npm-manifest',
    contractPath: null,
  },
  {
    owner: 'midnightntwrk',
    repo: 'compact',
    componentName: 'compact',
    componentType: 'toolchain',
    tagPrefix: 'compactc-v',
    manifestPath: null,
    providedPackageName: null,
    extractorKind: 'compact-toolchain-release',
    contractPath: null,
  },
  {
    owner: 'midnightntwrk',
    repo: 'midnight-node',
    componentName: 'midnight-node',
    componentType: 'runtime',
    tagPrefix: 'node-',
    manifestPath: null,
    providedPackageName: null,
    extractorKind: 'none',
    contractPath: null,
  },
  {
    owner: 'midnightntwrk',
    repo: 'example-counter',
    componentName: 'example-counter',
    componentType: 'template',
    // No GitHub releases/tags exist for this repo (verified against the real repository) — its
    // version comes from package.json at the default branch HEAD instead (see midnight-source-adapter.ts).
    tagPrefix: null,
    manifestPath: 'package.json',
    providedPackageName: 'example-counter',
    extractorKind: 'npm-manifest',
    contractPath: 'contract/src/counter.compact',
  },
  {
    owner: 'midnightntwrk',
    repo: 'midnight-docs',
    componentName: 'midnight-docs',
    componentType: 'documentation',
    tagPrefix: null,
    manifestPath: null,
    providedPackageName: null,
    extractorKind: 'none',
    contractPath: null,
  },
  {
    owner: 'midnightntwrk',
    repo: 'create-mn-app',
    componentName: 'create-mn-app',
    componentType: 'cli',
    tagPrefix: 'v',
    manifestPath: 'package.json',
    providedPackageName: 'create-mn-app',
    extractorKind: 'npm-manifest',
    contractPath: null,
  },
];
