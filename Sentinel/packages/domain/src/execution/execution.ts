import type { ExecutionId } from "../identity/execution-id.js";
import type { WorkflowId } from "../identity/workflow-id.js";
import type { CorrelationId } from "../identity/correlation-id.js";
import type { TraceId } from "../identity/trace-id.js";
import type { Event } from "../events/event.js";
import type { ExecutionStatus } from "./execution-status.js";

/**
 * The aggregate root for a single agent run. Owns a Timeline; does not
 * own the write path into that Timeline (that's the Execution Journal,
 * ADR-0006) — this is the read-side projection.
 */
export interface Execution {
  readonly executionId: ExecutionId;
  readonly workflowId: WorkflowId;
  readonly correlationId: CorrelationId;
  readonly traceId: TraceId;
  readonly status: ExecutionStatus;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
  readonly timeline: readonly Event[];
}

/**
 * The Decision/Tool/Payment "Timeline" product surfaces are all this
 * one filter over the same Timeline, not separate stores
 * (architecture.md §2).
 */
export function timelineByKind<K extends Event["kind"]>(
  execution: Pick<Execution, "timeline">,
  kind: K,
): Extract<Event, { kind: K }>[] {
  return execution.timeline.filter(
    (event): event is Extract<Event, { kind: K }> => event.kind === kind,
  );
}
