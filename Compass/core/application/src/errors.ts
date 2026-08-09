/** Base class for errors raised by use-case input validation, distinct from domain invariant violations. */
export abstract class ApplicationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Raised when a query gives the application layer nothing to evaluate
 * against. This is deliberately a hard failure rather than a fabricated
 * "unverified" result: a comparison with no second party isn't a
 * comparison, and fail-closed behavior for missing evidence
 * (ADR 0006) shouldn't be stretched to cover missing *inputs* by
 * inventing a self-comparison just to produce an answer.
 */
export class EmptyStackError extends ApplicationError {}
