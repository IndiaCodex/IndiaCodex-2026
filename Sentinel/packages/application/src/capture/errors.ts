/**
 * Every way the Execution Capture pipeline can deterministically reject
 * an incoming event, as a closed, stable set — so a caller (HTTP route,
 * SDK, test) can switch on `reason` instead of pattern-matching error
 * messages.
 */
export type EventRejectionReason =
  | "INVALID_ENVELOPE"
  /** Reserved for payload-level semantic validation beyond schema shape (e.g. cross-field business rules); not yet thrown by any capture path. */
  | "INVALID_PAYLOAD"
  | "UNKNOWN_EXECUTION"
  | "IDENTITY_MISMATCH"
  | "EXECUTION_ALREADY_TERMINAL"
  | "JOURNAL_INVARIANT_VIOLATION";

export class EventCaptureError extends Error {
  constructor(
    public readonly reason: EventRejectionReason,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "EventCaptureError";
  }
}
