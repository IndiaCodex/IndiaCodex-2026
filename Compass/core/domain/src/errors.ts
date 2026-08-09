/**
 * Base class for every error the domain layer raises. Application and
 * delivery layers are expected to catch `DomainError` specifically rather
 * than a generic `Error`, so a tool failure can never be confused with a
 * domain-level rejection (docs/architecture/cross-cutting-concerns.md#error-handling-strategy).
 */
export abstract class DomainError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Raised when a version or version range string cannot be parsed by a VersionScheme. */
export class InvalidVersionError extends DomainError {
  public constructor(raw: string, scheme: string) {
    super(`"${raw}" is not a valid version under the "${scheme}" version scheme.`);
  }
}

/** Raised when a constraint range string cannot be parsed. */
export class InvalidConstraintError extends DomainError {
  public constructor(raw: string, reason: string) {
    super(`"${raw}" is not a valid constraint expression: ${reason}`);
  }
}

/** Raised when two Version values that are compared or combined declare different schemes. */
export class IncompatibleVersionSchemeError extends DomainError {
  public constructor(a: string, b: string) {
    super(`Cannot compare a "${a}" version against a "${b}" version — they use different version schemes.`);
  }
}

/**
 * Raised when a CompatibilityRelationship, Risk, or Recommendation is constructed with a
 * status other than "unverified" but no Evidence backing it (ADR 0006).
 */
export class MissingEvidenceError extends DomainError {}

/** Raised when a domain entity is constructed with structurally invalid data. */
export class InvalidEntityError extends DomainError {}

/** Raised when a BreakingChange is constructed spanning two different Components. */
export class CrossComponentBreakingChangeError extends DomainError {
  public constructor() {
    super('A BreakingChange must reference two releases of the same Component.');
  }
}

/** Raised when a Risk is constructed with no contributing factors (ADR 0006's traceability requirement). */
export class UnsubstantiatedRiskError extends DomainError {}

/** Raised when a Recommendation is constructed with no rationale. */
export class UnsubstantiatedRecommendationError extends DomainError {}

/** Raised when a lookup against a Snapshot fails to find the referenced entity. */
export class NotFoundError extends DomainError {
  public constructor(kind: string, id: string) {
    super(`No ${kind} found with id "${id}".`);
  }
}
