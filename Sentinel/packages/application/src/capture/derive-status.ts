import type { Event, ExecutionStatus } from "@sentinel/domain";

/**
 * A `lifecycle` Event's transition maps 1:1 onto `ExecutionStatus`. Any
 * other Event kind means the agent is actively doing work, so the
 * Execution moves to (or stays at) `"running"` — `CaptureEventUseCase`
 * guarantees a `"started"` lifecycle Event always precedes any
 * tool/decision/payment Event and rejects Events once an Execution has
 * reached a terminal status, so this is never reached in either of
 * those invalid states.
 */
export function deriveStatus(event: Event): ExecutionStatus {
  return event.kind === "lifecycle" ? event.payload.transition : "running";
}
