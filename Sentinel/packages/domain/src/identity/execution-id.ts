import type { Brand } from "../shared/brand.js";
import { UUID_PATTERN, uuidv7 } from "../shared/uuid.js";

/** Identifies exactly one Execution. See ADR-0005. */
export type ExecutionId = Brand<string, "ExecutionId">;

/** Generates a new ExecutionId (UUIDv7), stamped by the SDK at execution start. */
export function createExecutionId(now?: Date): ExecutionId {
  return uuidv7(now) as ExecutionId;
}

export function isExecutionId(value: string): value is ExecutionId {
  return UUID_PATTERN.test(value);
}

export function parseExecutionId(value: string): ExecutionId {
  if (!isExecutionId(value)) {
    throw new TypeError(`Invalid ExecutionId: "${value}"`);
  }
  return value;
}
