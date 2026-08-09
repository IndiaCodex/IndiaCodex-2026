import type { ExecutionId } from "../identity/execution-id.js";
import type { WorkflowId } from "../identity/workflow-id.js";
import type { CorrelationId } from "../identity/correlation-id.js";
import type { TraceId } from "../identity/trace-id.js";
import type { Execution } from "../execution/execution.js";
import type { JournalEntry } from "../journal/journal-entry.js";
import type { ExecutionArtifact } from "../artifact/execution-artifact.js";

export interface ExecutionSearchQuery {
  readonly executionId?: ExecutionId;
  readonly traceId?: TraceId;
  readonly correlationId?: CorrelationId;
  readonly workflowId?: WorkflowId;
  readonly limit?: number;
}

/**
 * Persists and queries Executions, Journal entries, and Execution
 * Artifacts. Implemented today by interchangeable SQLite and in-memory
 * adapters validated against a shared contract test suite (ADR-0003); a
 * PostgreSQL adapter is roadmapped to reuse the same suite, not built
 * yet. The domain and application layers depend only on this interface,
 * never on a storage engine or query builder.
 */
export interface StoragePort {
  appendJournalEntry(entry: JournalEntry): Promise<void>;
  getJournalEntries(executionId: ExecutionId): Promise<readonly JournalEntry[]>;

  saveExecution(execution: Execution): Promise<void>;
  getExecution(executionId: ExecutionId): Promise<Execution | null>;
  searchExecutions(query: ExecutionSearchQuery): Promise<readonly Execution[]>;

  saveArtifact(artifact: ExecutionArtifact): Promise<void>;
  getArtifact(executionId: ExecutionId): Promise<ExecutionArtifact | null>;
}
