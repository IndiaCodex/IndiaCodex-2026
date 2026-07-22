import type { Brand } from "../shared/brand.js";
import { uuidv7 } from "../shared/uuid.js";
import type { ExecutionId } from "../identity/execution-id.js";
import type { SnapshotId } from "../snapshot/snapshot.js";
import type { DecisionPayload, LifecyclePayload, PaymentPayload, ToolPayload } from "./payloads.js";

export type EventId = Brand<string, "EventId">;

export function createEventId(): EventId {
  return uuidv7() as EventId;
}

interface EventEnvelope<Kind extends string, Payload> {
  readonly eventId: EventId;
  readonly executionId: ExecutionId;
  /** Strictly increasing within an Execution, starting at 0. Defines Journal order. */
  readonly sequence: number;
  readonly occurredAt: Date;
  readonly kind: Kind;
  readonly payload: Payload;
  /** Set iff this Event wraps a nondeterministic call captured as a Snapshot (ADR-0001). */
  readonly snapshotRef: SnapshotId | null;
  /** Free-form capture-time context (e.g. SDK version, host). Always present; defaults to `{}`. */
  readonly metadata: Readonly<Record<string, unknown>>;
}

export type DecisionEvent = EventEnvelope<"decision", DecisionPayload>;
export type ToolEvent = EventEnvelope<"tool", ToolPayload>;
export type PaymentEvent = EventEnvelope<"payment", PaymentPayload>;
export type LifecycleEvent = EventEnvelope<"lifecycle", LifecyclePayload>;

/**
 * A single fact in an Execution's Timeline. The four kinds share one
 * envelope; the Decision/Tool/Payment "Timeline" product surfaces are
 * `kind`-filtered views over this one union, not separate stores
 * (architecture.md §2).
 */
export type Event = DecisionEvent | ToolEvent | PaymentEvent | LifecycleEvent;

export type EventKind = Event["kind"];
