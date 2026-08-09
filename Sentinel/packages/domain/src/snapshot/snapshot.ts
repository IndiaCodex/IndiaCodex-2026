import type { Brand } from "../shared/brand.js";
import { uuidv7 } from "../shared/uuid.js";
import type { ExecutionId } from "../identity/execution-id.js";

export type SnapshotId = Brand<string, "SnapshotId">;

export function createSnapshotId(): SnapshotId {
  return uuidv7() as SnapshotId;
}

export type SnapshotKind =
  "llm-call" | "tool-call" | "external-api-call" | "clock-read" | "random-draw";

/**
 * Captured nondeterministic state: the exact input and output of one
 * LLM call, tool call, external API call, clock read, or random draw.
 * This is the mechanism that makes deterministic replay possible
 * despite the underlying operation being nondeterministic — replay
 * feeds `response` back instead of re-invoking the live operation
 * (ADR-0001). `request`/`response` are assumed JSON-serializable; the
 * capturing adapter is responsible for that at the instrumentation
 * boundary.
 */
export interface Snapshot {
  readonly snapshotId: SnapshotId;
  readonly executionId: ExecutionId;
  readonly kind: SnapshotKind;
  readonly request: unknown;
  readonly response: unknown;
  readonly capturedAt: Date;
}
