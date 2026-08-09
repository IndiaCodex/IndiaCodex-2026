import { toTimestamp } from '@compass/domain';
import type { Timestamp } from '@compass/domain';
import type { ClockPort } from '@compass/application';

/** The Action's real ClockPort implementation — every use case reaches "now" only through this. */
export class SystemClock implements ClockPort {
  public now(): Timestamp {
    return toTimestamp(new Date().toISOString());
  }
}
