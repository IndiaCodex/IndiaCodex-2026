/**
 * Node.js itself is not a Midnight ecosystem repository — it has no GitHub
 * entry in the registry — but real Midnight `package.json` files declare an
 * `engines.node` requirement (a genuine, standard npm convention), and
 * "minimum supported runtime" is one of the compatibility questions this
 * plugin needs to answer. So Node.js is modeled as a small, fixed,
 * publicly-documented set of well-known release lines — declared facts
 * (Node's own release schedule is public record), not a guess.
 */
import { toComponentId, toRepositoryId } from '@compass/domain';
import type { Component, Repository } from '@compass/domain';

export const NODE_REPOSITORY: Repository = {
  id: toRepositoryId('nodejs/node'),
  url: 'https://github.com/nodejs/node',
  hostingPlatform: 'github',
};

export const NODE_COMPONENT: Component = {
  id: toComponentId('nodejs/node'),
  name: 'node',
  type: 'runtime',
  repositoryId: NODE_REPOSITORY.id,
};

/** Well-known Node.js LTS release lines, current as of this plugin's construction. */
export const NODE_RELEASE_VERSIONS: readonly string[] = ['18.0.0', '20.0.0', '22.0.0'];
