import type { ExecutionId } from "./execution-id.js";
import type { Brand } from "../shared/brand.js";

/**
 * Groups Executions that belong to the same business operation —
 * retries, sub-agent spawns, multi-step orchestrations. See ADR-0005.
 */
export type CorrelationId = Brand<string, "CorrelationId">;

/**
 * Resolves the CorrelationId for a new Execution: the caller-supplied
 * value if this run is part of an existing business operation, or a
 * fresh value equal to this run's own ExecutionId if it starts one.
 */
export function resolveCorrelationId(
  executionId: ExecutionId,
  supplied?: string | null,
): CorrelationId {
  if (supplied && supplied.length > 0) {
    return supplied as CorrelationId;
  }
  return executionId as string as CorrelationId;
}
