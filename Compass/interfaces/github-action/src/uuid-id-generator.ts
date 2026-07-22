import { randomUUID } from 'node:crypto';
import type { IdGeneratorPort } from '@compass/application';

/** The Action's real IdGeneratorPort implementation — a random, collision-free id per kind. */
export class UuidIdGenerator implements IdGeneratorPort {
  public next(kind: string): string {
    return `${kind}-${randomUUID()}`;
  }
}
