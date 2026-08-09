/**
 * What the agent decided and which prior Events (by `sequence`) it was
 * conditioned on. Wraps exactly one LLM call boundary, captured as a
 * `"llm-call"` Snapshot. Unlike Tool/Payment, a decision has no
 * "pending" phase worth capturing separately — it is only recorded once
 * the LLM call that produced it has returned.
 */
export interface DecisionPayload {
  readonly summary: string;
  readonly rationale?: string;
  readonly inputRefs: readonly number[];
}

/**
 * A tool call is captured as two Events sharing one `toolName`/
 * `arguments`: `"invoked"` when the call starts (no Snapshot yet — the
 * arguments alone are deterministic input, not something replay needs to
 * substitute) and `"completed"` when it returns (carries the
 * `"tool-call"` Snapshot with the exact result, per ADR-0001). Modeling
 * these as a discriminated union on `phase` makes it a type error to
 * read `result` off an in-flight call.
 */
export interface ToolInvokedPayload {
  readonly phase: "invoked";
  readonly toolName: string;
  readonly arguments: unknown;
}

export interface ToolCompletedPayload {
  readonly phase: "completed";
  readonly toolName: string;
  readonly arguments: unknown;
  readonly result: unknown;
  readonly error?: string;
}

export type ToolPayload = ToolInvokedPayload | ToolCompletedPayload;

export type PaymentState = "initiated" | "submitted" | "confirmed" | "failed";

/**
 * A Masumi payment is captured as two Events: `"requested"` when
 * Sentinel observes the agent asking Masumi to move money (no Snapshot
 * yet — the request itself, not its outcome) and `"completed"` when
 * Masumi's outcome is known (carries the `"external-api-call"` Snapshot,
 * per ADR-0001). `amount` is a decimal string, never a float, to avoid
 * floating-point precision loss on money.
 */
export interface PaymentRequestedPayload {
  readonly phase: "requested";
  readonly paymentId: string;
  readonly amount: string;
  readonly currency: string;
  readonly masumiReference?: string;
}

export interface PaymentCompletedPayload {
  readonly phase: "completed";
  readonly paymentId: string;
  readonly amount: string;
  readonly currency: string;
  readonly state: Extract<PaymentState, "confirmed" | "failed">;
  readonly masumiReference?: string;
}

export type PaymentPayload = PaymentRequestedPayload | PaymentCompletedPayload;

export type LifecycleTransition = "started" | "retried" | "completed" | "failed";

/**
 * Execution-level bookkeeping produced by the Execution Journal itself,
 * not by an external call — never carries a Snapshot.
 */
export interface LifecyclePayload {
  readonly transition: LifecycleTransition;
  readonly retriesExecutionId?: string;
  readonly failureReason?: string;
}
