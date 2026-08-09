import type { ExecutionId } from "../identity/execution-id.js";
import type { WorkflowId } from "../identity/workflow-id.js";
import type { CorrelationId } from "../identity/correlation-id.js";
import type { TraceId } from "../identity/trace-id.js";
import type { PaymentState } from "../events/payloads.js";
import type { ReplayFidelity } from "../replay/replay-session.js";
import type { EngineeringExplanation } from "./engineering-explanation.js";

export type ExecutionOutcome = "completed" | "failed" | "in-progress";

export interface ExecutionSummary {
  readonly executionId: ExecutionId;
  readonly workflowId: WorkflowId;
  readonly correlationId: CorrelationId;
  readonly traceId: TraceId;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
  readonly durationMs: number | null;
  readonly eventCount: number;
  readonly toolInvocationCount: number;
  readonly decisionCount: number;
  readonly paymentCount: number;
  readonly outcome: ExecutionOutcome;
}

export interface FailureExplanation {
  readonly failed: boolean;
  readonly failedAtSequence: number | null;
  readonly reason: string | null;
}

export type ToolExecutionOutcome = "succeeded" | "failed" | "pending";

export interface ToolExecutionStep {
  readonly toolName: string;
  readonly invokedAtSequence: number;
  readonly completedAtSequence: number | null;
  readonly durationMs: number | null;
  readonly outcome: ToolExecutionOutcome;
  readonly error: string | null;
}

export interface PaymentLifecycleStep {
  readonly paymentId: string;
  readonly requestedAtSequence: number | null;
  readonly completedAtSequence: number | null;
  readonly amount: string;
  readonly currency: string;
  readonly state: PaymentState | "pending";
  readonly masumiReference: string | null;
}

export interface JournalIntegrityStatus {
  readonly intact: boolean;
  readonly checkedAt: Date;
  readonly issueCount: number;
}

export interface ReplayValidationStatus {
  readonly replayed: boolean;
  readonly fidelity: ReplayFidelity | null;
  readonly divergedAt: number | null;
}

/**
 * The deterministic, rule-based explanation of one Execution
 * (ADR-0002 Engineering Mode) — every field is derived directly from
 * the Execution Artifact and its VerificationReport/ReplaySession by
 * `@sentinel/explainability`, with no LLM or probabilistic step
 * anywhere in the path. Structured and machine-readable by design, so
 * it's exactly as valid a target for automated assertions as for
 * rendering to a human.
 */
export interface EngineeringExplainabilityReport {
  readonly executionSummary: ExecutionSummary;
  readonly timelineSummary: readonly EngineeringExplanation[];
  readonly failure: FailureExplanation;
  readonly toolExecutionSequence: readonly ToolExecutionStep[];
  readonly paymentLifecycle: readonly PaymentLifecycleStep[];
  readonly journalIntegrity: JournalIntegrityStatus;
  readonly replayValidation: ReplayValidationStatus;
  readonly generatedAt: Date;
}
