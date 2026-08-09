import {
  appendJournalEntry,
  createEventId,
  createExecutionId,
  createSnapshotId,
  createTraceId,
  parseWorkflowId,
  resolveCorrelationId,
  sealJournal,
  type CorrelationId,
  type DecisionEvent,
  type Event,
  type Execution,
  type ExecutionArtifact,
  type ExecutionArtifactProvenance,
  type ExecutionId,
  type ExecutionStatus,
  type JournalEntry,
  type LifecycleEvent,
  type LifecycleTransition,
  type PaymentEvent,
  type Snapshot,
  type ToolEvent,
  type TraceId,
  type WorkflowId,
} from "@sentinel/domain";

export function testWorkflowId(): WorkflowId {
  return parseWorkflowId("demo-support-agent");
}

export function testExecutionId(now?: Date): ExecutionId {
  return createExecutionId(now);
}

export function testTraceId(): TraceId {
  return createTraceId();
}

export function testCorrelationId(executionId: ExecutionId): CorrelationId {
  return resolveCorrelationId(executionId);
}

export function buildLifecycleEvent(
  executionId: ExecutionId,
  sequence: number,
  transition: LifecycleTransition = "started",
  occurredAt: Date = new Date(),
): LifecycleEvent {
  return {
    eventId: createEventId(),
    executionId,
    sequence,
    occurredAt,
    kind: "lifecycle",
    payload: { transition },
    snapshotRef: null,
    metadata: {},
  };
}

export function buildToolInvokedEvent(
  executionId: ExecutionId,
  sequence: number,
  options: { toolName?: string; arguments?: unknown; occurredAt?: Date } = {},
): ToolEvent {
  return {
    eventId: createEventId(),
    executionId,
    sequence,
    occurredAt: options.occurredAt ?? new Date(),
    kind: "tool",
    payload: {
      phase: "invoked",
      toolName: options.toolName ?? "knowledge_base_search",
      arguments: options.arguments ?? { query: "reset password" },
    },
    snapshotRef: null,
    metadata: {},
  };
}

export function buildToolCompletedEvent(
  executionId: ExecutionId,
  sequence: number,
  options: {
    toolName?: string;
    arguments?: unknown;
    result?: unknown;
    error?: string;
    occurredAt?: Date;
  } = {},
): { event: ToolEvent; snapshot: Snapshot } {
  const occurredAt = options.occurredAt ?? new Date();
  const toolName = options.toolName ?? "knowledge_base_search";
  const args = options.arguments ?? { query: "reset password" };
  const result = options.result ?? { articles: ["kb-042"] };

  const snapshot: Snapshot = {
    snapshotId: createSnapshotId(),
    executionId,
    kind: "tool-call",
    request: { toolName, arguments: args },
    response: options.error ? { error: options.error } : { result },
    capturedAt: occurredAt,
  };

  const event: ToolEvent = {
    eventId: createEventId(),
    executionId,
    sequence,
    occurredAt,
    kind: "tool",
    payload: options.error
      ? { phase: "completed", toolName, arguments: args, result: null, error: options.error }
      : { phase: "completed", toolName, arguments: args, result },
    snapshotRef: snapshot.snapshotId,
    metadata: {},
  };

  return { event, snapshot };
}

export function buildDecisionEvent(
  executionId: ExecutionId,
  sequence: number,
  options: {
    summary?: string;
    rationale?: string;
    inputRefs?: readonly number[];
    llmResponse?: unknown;
    occurredAt?: Date;
  } = {},
): { event: DecisionEvent; snapshot: Snapshot } {
  const occurredAt = options.occurredAt ?? new Date();
  const summary = options.summary ?? "Proceed with refund";
  const inputRefs = options.inputRefs ?? (sequence > 0 ? [sequence - 1] : []);

  const snapshot: Snapshot = {
    snapshotId: createSnapshotId(),
    executionId,
    kind: "llm-call",
    request: { prompt: `Given the tool results, decide: ${summary}?` },
    response: options.llmResponse ?? { text: summary },
    capturedAt: occurredAt,
  };

  const event: DecisionEvent = {
    eventId: createEventId(),
    executionId,
    sequence,
    occurredAt,
    kind: "decision",
    payload: {
      summary,
      ...(options.rationale !== undefined ? { rationale: options.rationale } : {}),
      inputRefs,
    },
    snapshotRef: snapshot.snapshotId,
    metadata: {},
  };

  return { event, snapshot };
}

export function buildPaymentRequestedEvent(
  executionId: ExecutionId,
  sequence: number,
  options: {
    paymentId?: string;
    amount?: string;
    currency?: string;
    masumiReference?: string;
    occurredAt?: Date;
  } = {},
): PaymentEvent {
  return {
    eventId: createEventId(),
    executionId,
    sequence,
    occurredAt: options.occurredAt ?? new Date(),
    kind: "payment",
    payload: {
      phase: "requested",
      paymentId: options.paymentId ?? "pay_demo_001",
      amount: options.amount ?? "4.50",
      currency: options.currency ?? "ADA",
      ...(options.masumiReference !== undefined
        ? { masumiReference: options.masumiReference }
        : {}),
    },
    snapshotRef: null,
    metadata: {},
  };
}

export function buildPaymentCompletedEvent(
  executionId: ExecutionId,
  sequence: number,
  options: {
    paymentId?: string;
    amount?: string;
    currency?: string;
    state?: "confirmed" | "failed";
    masumiReference?: string;
    occurredAt?: Date;
  } = {},
): { event: PaymentEvent; snapshot: Snapshot } {
  const occurredAt = options.occurredAt ?? new Date();
  const paymentId = options.paymentId ?? "pay_demo_001";
  const amount = options.amount ?? "4.50";
  const currency = options.currency ?? "ADA";
  const state = options.state ?? "confirmed";
  const masumiReference = options.masumiReference ?? "masumi_tx_7f3a";

  const snapshot: Snapshot = {
    snapshotId: createSnapshotId(),
    executionId,
    kind: "external-api-call",
    request: { paymentId, amount, currency },
    response: { state, masumiReference },
    capturedAt: occurredAt,
  };

  const event: PaymentEvent = {
    eventId: createEventId(),
    executionId,
    sequence,
    occurredAt,
    kind: "payment",
    payload: { phase: "completed", paymentId, amount, currency, state, masumiReference },
    snapshotRef: snapshot.snapshotId,
    metadata: {},
  };

  return { event, snapshot };
}

/**
 * Runs a sequence of {event, snapshot} pairs through the real
 * `appendJournalEntry` domain function, so tests exercise the same
 * hash-chaining and invariant validation production code uses, rather
 * than fabricating JournalEntry objects by hand.
 */
export async function buildJournalChain(
  steps: ReadonlyArray<{ event: Event; snapshot: Snapshot | null }>,
): Promise<JournalEntry[]> {
  const entries: JournalEntry[] = [];
  for (const step of steps) {
    entries.push(await appendJournalEntry(entries, step.event, step.snapshot));
  }
  return entries;
}

export interface BuildExecutionOptions {
  readonly executionId: ExecutionId;
  readonly workflowId?: WorkflowId;
  readonly correlationId?: CorrelationId;
  readonly traceId?: TraceId;
  readonly status?: ExecutionStatus;
  readonly startedAt?: Date;
  readonly endedAt?: Date | null;
  readonly timeline?: readonly Event[];
}

/** Builds a plausible `Execution` read model directly, without deriving it from real capture logic. */
export function buildExecution(options: BuildExecutionOptions): Execution {
  return {
    executionId: options.executionId,
    workflowId: options.workflowId ?? testWorkflowId(),
    correlationId: options.correlationId ?? resolveCorrelationId(options.executionId),
    traceId: options.traceId ?? createTraceId(),
    status: options.status ?? "started",
    startedAt: options.startedAt ?? new Date(),
    endedAt: options.endedAt ?? null,
    timeline: options.timeline ?? [],
  };
}

export interface BuildArtifactOptions {
  readonly workflowId?: WorkflowId;
  readonly correlationId?: CorrelationId;
  readonly traceId?: TraceId;
  readonly producedBy?: ExecutionArtifactProvenance;
  readonly sealedAt?: Date;
}

/** Seals a JournalEntry chain (built via `buildJournalChain`) into a real `ExecutionArtifact`. */
export function buildArtifact(
  entries: readonly JournalEntry[],
  options: BuildArtifactOptions = {},
): ExecutionArtifact {
  const first = entries[0];
  if (!first) {
    throw new Error("buildArtifact requires at least one JournalEntry");
  }
  return sealJournal({
    executionId: first.executionId,
    workflowId: options.workflowId ?? testWorkflowId(),
    correlationId: options.correlationId ?? resolveCorrelationId(first.executionId),
    traceId: options.traceId ?? testTraceId(),
    entries,
    producedBy: options.producedBy ?? { sdkVersion: "0.0.0-test", journalVersion: "0.0.0-test" },
    ...(options.sealedAt !== undefined ? { sealedAt: options.sealedAt } : {}),
  });
}
