import type {
  EngineeringExplainabilityReport,
  ExecutionArtifact,
  ExecutionOutcome,
  ExecutionSummary,
  FailureExplanation,
  LifecycleEvent,
  PaymentEvent,
  PaymentLifecycleStep,
  ReplaySession,
  ToolEvent,
  ToolExecutionStep,
  VerificationReport,
} from "@sentinel/domain";
import { explainEvent } from "./explain-event.js";

export interface BuildExplainabilityReportInput {
  readonly artifact: ExecutionArtifact;
  readonly verification: VerificationReport;
  readonly replay: ReplaySession | null;
}

/**
 * Builds the complete deterministic, rule-based explanation of one
 * Execution (ADR-0002 Engineering Mode) — every field derived from the
 * artifact, its verification report, and (optionally) a replay session.
 * No AI, no natural-language generation, no probabilistic reasoning
 * anywhere in this module.
 */
export function buildExplainabilityReport(
  input: BuildExplainabilityReportInput,
): EngineeringExplainabilityReport {
  const { artifact, verification, replay } = input;
  const { timeline } = artifact;

  const lifecycleEvents = timeline.filter(
    (event): event is LifecycleEvent => event.kind === "lifecycle",
  );
  const toolEvents = timeline.filter((event): event is ToolEvent => event.kind === "tool");
  const paymentEvents = timeline.filter((event): event is PaymentEvent => event.kind === "payment");

  const startedEvent = lifecycleEvents.find((event) => event.payload.transition === "started");
  const failedEvent = lifecycleEvents.find((event) => event.payload.transition === "failed");
  const completedEvent = lifecycleEvents.find((event) => event.payload.transition === "completed");
  const terminalEvent = failedEvent ?? completedEvent;

  return {
    executionSummary: buildExecutionSummary({
      artifact,
      startedEvent,
      terminalEvent,
      failed: Boolean(failedEvent),
      toolEvents,
      timeline,
    }),
    timelineSummary: timeline.map(explainEvent),
    failure: buildFailureExplanation(failedEvent),
    toolExecutionSequence: buildToolExecutionSequence(toolEvents),
    paymentLifecycle: buildPaymentLifecycle(paymentEvents),
    journalIntegrity: {
      intact: verification.valid,
      checkedAt: verification.checkedAt,
      issueCount: verification.issues.length,
    },
    replayValidation: {
      replayed: replay !== null,
      fidelity: replay?.fidelity ?? null,
      divergedAt: replay?.divergedAt ?? null,
    },
    generatedAt: new Date(),
  };
}

function buildExecutionSummary(args: {
  artifact: ExecutionArtifact;
  startedEvent: LifecycleEvent | undefined;
  terminalEvent: LifecycleEvent | undefined;
  failed: boolean;
  toolEvents: readonly ToolEvent[];
  timeline: ExecutionArtifact["timeline"];
}): ExecutionSummary {
  const { artifact, startedEvent, terminalEvent, failed, toolEvents, timeline } = args;
  const startedAt = startedEvent?.occurredAt ?? timeline[0]?.occurredAt ?? artifact.sealedAt;
  const endedAt = terminalEvent?.occurredAt ?? null;
  const outcome: ExecutionOutcome = terminalEvent
    ? failed
      ? "failed"
      : "completed"
    : "in-progress";

  return {
    executionId: artifact.executionId,
    workflowId: artifact.workflowId,
    correlationId: artifact.correlationId,
    traceId: artifact.traceId,
    startedAt,
    endedAt,
    durationMs: endedAt ? endedAt.getTime() - startedAt.getTime() : null,
    eventCount: timeline.length,
    toolInvocationCount: toolEvents.filter((event) => event.payload.phase === "invoked").length,
    decisionCount: timeline.filter((event) => event.kind === "decision").length,
    paymentCount: timeline.filter(
      (event) => event.kind === "payment" && event.payload.phase === "requested",
    ).length,
    outcome,
  };
}

function buildFailureExplanation(failedEvent: LifecycleEvent | undefined): FailureExplanation {
  return {
    failed: Boolean(failedEvent),
    failedAtSequence: failedEvent?.sequence ?? null,
    reason:
      (failedEvent?.payload.transition === "failed"
        ? failedEvent.payload.failureReason
        : undefined) ?? null,
  };
}

/**
 * Pairs each `"invoked"` Tool Event with its matching `"completed"`
 * Event, per tool name, in call order (a FIFO queue per tool name
 * handles a tool being called more than once in the same Execution
 * without mismatching invocations and completions).
 */
function buildToolExecutionSequence(toolEvents: readonly ToolEvent[]): ToolExecutionStep[] {
  const pendingByToolName = new Map<string, ToolEvent[]>();
  const steps: ToolExecutionStep[] = [];

  for (const event of toolEvents) {
    if (event.payload.phase === "invoked") {
      const queue = pendingByToolName.get(event.payload.toolName) ?? [];
      queue.push(event);
      pendingByToolName.set(event.payload.toolName, queue);
      continue;
    }

    const queue = pendingByToolName.get(event.payload.toolName) ?? [];
    const invoked = queue.shift();
    const durationMs = invoked ? event.occurredAt.getTime() - invoked.occurredAt.getTime() : null;
    steps.push({
      toolName: event.payload.toolName,
      invokedAtSequence: invoked?.sequence ?? event.sequence,
      completedAtSequence: event.sequence,
      durationMs,
      outcome: event.payload.error ? "failed" : "succeeded",
      error: event.payload.error ?? null,
    });
  }

  for (const queue of pendingByToolName.values()) {
    for (const invoked of queue) {
      steps.push({
        toolName: invoked.payload.toolName,
        invokedAtSequence: invoked.sequence,
        completedAtSequence: null,
        durationMs: null,
        outcome: "pending",
        error: null,
      });
    }
  }

  return steps.sort((a, b) => a.invokedAtSequence - b.invokedAtSequence);
}

function buildPaymentLifecycle(paymentEvents: readonly PaymentEvent[]): PaymentLifecycleStep[] {
  const byPaymentId = new Map<string, { requested?: PaymentEvent; completed?: PaymentEvent }>();

  for (const event of paymentEvents) {
    const entry = byPaymentId.get(event.payload.paymentId) ?? {};
    if (event.payload.phase === "requested") {
      entry.requested = event;
    } else {
      entry.completed = event;
    }
    byPaymentId.set(event.payload.paymentId, entry);
  }

  const steps: PaymentLifecycleStep[] = [];
  for (const [paymentId, { requested, completed }] of byPaymentId) {
    const amount = completed?.payload.amount ?? requested?.payload.amount ?? "0";
    const currency = completed?.payload.currency ?? requested?.payload.currency ?? "";
    const completedPayload =
      completed?.payload.phase === "completed" ? completed.payload : undefined;

    steps.push({
      paymentId,
      requestedAtSequence: requested?.sequence ?? null,
      completedAtSequence: completed?.sequence ?? null,
      amount,
      currency,
      state: completedPayload?.state ?? "pending",
      masumiReference: completedPayload?.masumiReference ?? null,
    });
  }

  return steps.sort((a, b) => (a.requestedAtSequence ?? 0) - (b.requestedAtSequence ?? 0));
}
