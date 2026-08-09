import { randomUUID } from 'node:crypto';
import type { IdGeneratorPort } from '@compass/application';

/** The CLI's real IdGeneratorPort implementation — a random, collision-free id per kind, never a counter that could repeat across process restarts. */
export class UuidIdGenerator implements IdGeneratorPort {
  public next(kind: string): string {
    return `${kind}-${randomUUID()}`;
  }
}
