import type { Timestamp } from '@compass/domain';

/**
 * The only source of "now" a use case is allowed to consult. Injected so
 * ingestion and evaluation stay reproducible in tests — no use case may
 * call `Date.now()` or `new Date()` directly.
 */
export interface ClockPort {
  now(): Timestamp;
}
