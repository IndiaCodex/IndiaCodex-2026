/**
 * Wire-format mirrors of the `@sentinel/domain` shapes the API returns.
 * Deliberately hand-written rather than a generic `Serialized<T>` over
 * the domain types: JSON round-tripping turns `Date` into `string` and
 * strips branded-ID nominal typing down to plain `string`, and a fully
 * generic mapped type over domain's branded intersections
 * (`string & { __brand }`) is more fragile than it's worth. Plain
 * string-literal unions (no branding) are still imported directly from
 * domain, so those enums can never drift from the server's.
 */
import type {
  EventKind,
  ExecutionOutcome,
  ExecutionStatus,
  LifecycleTransition,
  PaymentState,
  ReplayFidelity,
  SnapshotKind,
  ToolExecutionOutcome,
} from "@sentinel/domain";

interface WireEventBase {
  readonly eventId: string;
  readonly executionId: string;
  readonly sequence: number;
  readonly occurredAt: string;
  readonly kind: EventKind;
  readonly snapshotRef: string | null;
  readonly metadata: Record<string, unknown>;
}

export interface WireDecisionEvent extends WireEventBase {
  readonly kind: "decision";
  readonly payload: {
    readonly summary: string;
    readonly rationale?: string;
    readonly inputRefs: readonly number[];
  };
}

export type WireToolPayload =
  | { readonly phase: "invoked"; readonly toolName: string; readonly arguments: unknown }
  | {
      readonly phase: "completed";
      readonly toolName: string;
      readonly arguments: unknown;
      readonly result: unknown;
      readonly error?: string;
    };

export interface WireToolEvent extends WireEventBase {
  readonly kind: "tool";
  readonly payload: WireToolPayload;
}

export type WirePaymentPayload =
  | {
      readonly phase: "requested";
      readonly paymentId: string;
      readonly amount: string;
      readonly currency: string;
      readonly masumiReference?: string;
    }
  | {
      readonly phase: "completed";
      readonly paymentId: string;
      readonly amount: string;
      readonly currency: string;
      readonly state: Extract<PaymentState, "confirmed" | "failed">;
      readonly masumiReference?: string;
    };

export interface WirePaymentEvent extends WireEventBase {
  readonly kind: "payment";
  readonly payload: WirePaymentPayload;
}

export interface WireLifecycleEvent extends WireEventBase {
  readonly kind: "lifecycle";
  readonly payload: {
    readonly transition: LifecycleTransition;
    readonly retriesExecutionId?: string;
    readonly failureReason?: string;
  };
}

export type WireEvent = WireDecisionEvent | WireToolEvent | WirePaymentEvent | WireLifecycleEvent;

export interface WireSnapshot {
  readonly snapshotId: string;
  readonly executionId: string;
  readonly kind: SnapshotKind;
  readonly request: unknown;
  readonly response: unknown;
  readonly capturedAt: string;
}

export interface WireExecution {
  readonly executionId: string;
  readonly workflowId: string;
  readonly correlationId: string;
  readonly traceId: string;
  readonly status: ExecutionStatus;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly timeline: readonly WireEvent[];
}

export interface WireExecutionArtifact {
  readonly artifactId: string;
  readonly executionId: string;
  readonly workflowId: string;
  readonly correlationId: string;
  readonly traceId: string;
  readonly timeline: readonly WireEvent[];
  readonly snapshots: readonly WireSnapshot[];
  readonly rootHash: string;
  readonly sealedAt: string;
  readonly schemaVersion: string;
  readonly producedBy: { readonly sdkVersion: string; readonly journalVersion: string };
  readonly signature: string | null;
}

export interface WireVerificationIssue {
  readonly code: string;
  readonly message: string;
  readonly sequence: number | null;
}

export interface WireVerificationChecks {
  readonly schemaVersionSupported: boolean;
  readonly eventOrdering: boolean;
  readonly identityConsistency: boolean;
  readonly snapshotConsistency: boolean;
  readonly hashChain: boolean;
  readonly rootHash: boolean;
}

export interface WireVerificationReport {
  readonly valid: boolean;
  readonly checkedAt: string;
  readonly checks: WireVerificationChecks;
  readonly issues: readonly WireVerificationIssue[];
}

export interface WireReplaySession {
  readonly replaySessionId: string;
  readonly sourceArtifactId: string | null;
  readonly sourceExecutionId: string;
  readonly replayedTimeline: readonly WireEvent[];
  readonly replayedSnapshots: readonly WireSnapshot[];
  readonly fidelity: ReplayFidelity;
  readonly divergedAt: number | null;
  readonly verification: WireVerificationReport;
  readonly replayedAt: string;
}

export interface WireExplanation {
  readonly subjectEventSequence: number;
  readonly text: string;
  readonly citedEvents: readonly number[];
}

export interface WireExecutionSummary {
  readonly executionId: string;
  readonly workflowId: string;
  readonly correlationId: string;
  readonly traceId: string;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly durationMs: number | null;
  readonly eventCount: number;
  readonly toolInvocationCount: number;
  readonly decisionCount: number;
  readonly paymentCount: number;
  readonly outcome: ExecutionOutcome;
}

export interface WireFailureExplanation {
  readonly failed: boolean;
  readonly failedAtSequence: number | null;
  readonly reason: string | null;
}

export interface WireToolExecutionStep {
  readonly toolName: string;
  readonly invokedAtSequence: number;
  readonly completedAtSequence: number | null;
  readonly durationMs: number | null;
  readonly outcome: ToolExecutionOutcome;
  readonly error: string | null;
}

export interface WirePaymentLifecycleStep {
  readonly paymentId: string;
  readonly requestedAtSequence: number | null;
  readonly completedAtSequence: number | null;
  readonly amount: string;
  readonly currency: string;
  readonly state: PaymentState | "pending";
  readonly masumiReference: string | null;
}

export interface WireJournalIntegrityStatus {
  readonly intact: boolean;
  readonly checkedAt: string;
  readonly issueCount: number;
}

export interface WireReplayValidationStatus {
  readonly replayed: boolean;
  readonly fidelity: ReplayFidelity | null;
  readonly divergedAt: number | null;
}

export interface WireExplainabilityReport {
  readonly executionSummary: WireExecutionSummary;
  readonly timelineSummary: readonly WireExplanation[];
  readonly failure: WireFailureExplanation;
  readonly toolExecutionSequence: readonly WireToolExecutionStep[];
  readonly paymentLifecycle: readonly WirePaymentLifecycleStep[];
  readonly journalIntegrity: WireJournalIntegrityStatus;
  readonly replayValidation: WireReplayValidationStatus;
  readonly generatedAt: string;
}

export interface WireHashChainEntry {
  readonly sequence: number;
  readonly previousEntryHash: string | null;
  readonly entryHash: string;
}

export interface WireAuditExport {
  readonly exportSchemaVersion: string;
  readonly exportedAt: string;
  readonly artifact: WireExecutionArtifact;
  readonly hashChain: readonly WireHashChainEntry[];
  readonly verification: WireVerificationReport;
  readonly replay: WireReplaySession | null;
  readonly explainability: WireExplainabilityReport;
}

export interface WireApiErrorBody {
  readonly error: { readonly code: string; readonly message: string };
}
