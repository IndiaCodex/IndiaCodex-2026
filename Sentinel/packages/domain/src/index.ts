// Shared primitives
export type { Brand } from "./shared/brand.js";
export { canonicalJson } from "./shared/canonical-json.js";
export { sha256Hex, type Hash } from "./shared/hash.js";
export { uuidv7, UUID_PATTERN } from "./shared/uuid.js";

// Identity (ADR-0005)
export {
  createExecutionId,
  isExecutionId,
  parseExecutionId,
  type ExecutionId,
} from "./identity/execution-id.js";
export { parseWorkflowId, isWorkflowId, type WorkflowId } from "./identity/workflow-id.js";
export { resolveCorrelationId, type CorrelationId } from "./identity/correlation-id.js";
export { createTraceId, isTraceId, parseTraceParent, type TraceId } from "./identity/trace-id.js";

// Events
export type {
  DecisionPayload,
  ToolPayload,
  ToolInvokedPayload,
  ToolCompletedPayload,
  PaymentPayload,
  PaymentRequestedPayload,
  PaymentCompletedPayload,
  PaymentState,
  LifecyclePayload,
  LifecycleTransition,
} from "./events/payloads.js";
export {
  createEventId,
  type Event,
  type EventId,
  type EventKind,
  type DecisionEvent,
  type ToolEvent,
  type PaymentEvent,
  type LifecycleEvent,
} from "./events/event.js";

// Snapshot (ADR-0001)
export {
  createSnapshotId,
  type Snapshot,
  type SnapshotId,
  type SnapshotKind,
} from "./snapshot/snapshot.js";

// Journal (ADR-0006)
export { requiresSnapshot } from "./journal/invariants.js";
export {
  appendJournalEntry,
  verifyJournalChain,
  JournalInvariantViolation,
  JournalCorruptionError,
  type JournalEntry,
  type JournalEntryId,
} from "./journal/journal-entry.js";

// Execution aggregate
export { isTerminalStatus, type ExecutionStatus } from "./execution/execution-status.js";
export { timelineByKind, type Execution } from "./execution/execution.js";

// Execution Artifact (ADR-0004)
export {
  sealJournal,
  SealValidationError,
  EXECUTION_ARTIFACT_SCHEMA_VERSION,
  type ExecutionArtifact,
  type ExecutionArtifactId,
  type ExecutionArtifactProvenance,
  type SealJournalInput,
} from "./artifact/execution-artifact.js";
export {
  recomputeHashChain,
  type HashChainEntry,
  type RecomputedHashChain,
} from "./artifact/hash-chain.js";
export { verifyArtifact } from "./artifact/verify-artifact.js";

// Verification (Step 3.3)
export type {
  VerificationReport,
  VerificationChecks,
  VerificationIssue,
} from "./verification/verification-report.js";

// Replay (ADR-0001, Step 3.3)
export type { ReplaySession, ReplaySessionId, ReplayFidelity } from "./replay/replay-session.js";
export { replayArtifact, ReplayIntegrityError } from "./replay/replay-artifact.js";

// Explainability (ADR-0002)
export type { EngineeringExplanation } from "./explanation/engineering-explanation.js";
export type {
  EngineeringExplainabilityReport,
  ExecutionSummary,
  ExecutionOutcome,
  FailureExplanation,
  ToolExecutionStep,
  ToolExecutionOutcome,
  PaymentLifecycleStep,
  JournalIntegrityStatus,
  ReplayValidationStatus,
} from "./explanation/engineering-explainability-report.js";

// Export (Step 3.3)
export {
  assembleExecutionAuditExport,
  EXECUTION_AUDIT_EXPORT_SCHEMA_VERSION,
  type ExecutionAuditExport,
  type AssembleExecutionAuditExportInput,
} from "./export/execution-audit-export.js";

// Ports
export type { StoragePort, ExecutionSearchQuery } from "./ports/storage-port.js";
export type { ExecutionJournalPort } from "./ports/execution-journal-port.js";
export type { MasumiAdapterPort } from "./ports/masumi-adapter-port.js";
export type { ExportPort, ExportFormat } from "./ports/export-port.js";
