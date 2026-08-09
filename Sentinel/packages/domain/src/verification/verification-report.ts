/**
 * A single deterministic finding from `verifyArtifact`. `sequence` is
 * set when the issue is scoped to one Event, `null` for artifact-wide
 * issues (e.g. schema version).
 */
export interface VerificationIssue {
  readonly code: string;
  readonly message: string;
  readonly sequence: number | null;
}

/**
 * The six checks Step 3.3 requires: hash chain, root hash, event
 * ordering, snapshot consistency, identity consistency, and schema
 * version. Each is independently reported so a caller can see exactly
 * which property failed, not just that "something" is wrong.
 */
export interface VerificationChecks {
  readonly schemaVersionSupported: boolean;
  readonly eventOrdering: boolean;
  readonly identityConsistency: boolean;
  readonly snapshotConsistency: boolean;
  readonly hashChain: boolean;
  readonly rootHash: boolean;
}

/**
 * The structured, machine-readable report `verifyArtifact` produces.
 * `valid` is true iff every check in `checks` passed — Replay
 * (ADR-0001) refuses to proceed when `valid` is false.
 */
export interface VerificationReport {
  readonly valid: boolean;
  readonly checkedAt: Date;
  readonly checks: VerificationChecks;
  readonly issues: readonly VerificationIssue[];
}
