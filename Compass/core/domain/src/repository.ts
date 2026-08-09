import type { RepositoryId } from './ids.js';

/** Where an ecosystem's source lives — not a Compass Git repository, an ecosystem-observed one. */
export interface Repository {
  readonly id: RepositoryId;
  readonly url: string;
  readonly hostingPlatform: string;
}
