import type {
  DecisionEvent,
  EngineeringExplanation,
  Event,
  LifecycleEvent,
  PaymentEvent,
  ToolEvent,
} from "@sentinel/domain";

/**
 * Produces a deterministic, template-based `EngineeringExplanation` for
 * one Event. Purely a function of the Event's own fields — no lookups,
 * no model calls, no randomness. Given the same Event, always returns
 * the same text (ADR-0002 Engineering Mode).
 */
export function explainEvent(event: Event): EngineeringExplanation {
  switch (event.kind) {
    case "lifecycle":
      return explainLifecycle(event);
    case "tool":
      return explainTool(event);
    case "decision":
      return explainDecision(event);
    case "payment":
      return explainPayment(event);
  }
}

function explainLifecycle(event: LifecycleEvent): EngineeringExplanation {
  const { transition, failureReason, retriesExecutionId } = event.payload;
  let text: string;
  switch (transition) {
    case "started":
      text = "Execution started.";
      break;
    case "completed":
      text = "Execution completed successfully.";
      break;
    case "failed":
      text = failureReason ? `Execution failed: ${failureReason}` : "Execution failed.";
      break;
    case "retried":
      text = retriesExecutionId
        ? `Execution retried (replaces execution "${retriesExecutionId}").`
        : "Execution retried.";
      break;
  }
  return { subjectEventSequence: event.sequence, text, citedEvents: [] };
}

function explainTool(event: ToolEvent): EngineeringExplanation {
  const { toolName } = event.payload;
  if (event.payload.phase === "invoked") {
    return {
      subjectEventSequence: event.sequence,
      text: `Tool "${toolName}" invoked.`,
      citedEvents: [],
    };
  }
  const { error } = event.payload;
  const text = error
    ? `Tool "${toolName}" failed: ${error}`
    : `Tool "${toolName}" completed successfully.`;
  return { subjectEventSequence: event.sequence, text, citedEvents: [] };
}

function explainDecision(event: DecisionEvent): EngineeringExplanation {
  const { summary, rationale, inputRefs } = event.payload;
  const text = rationale
    ? `Decision recorded: ${summary}. Rationale: ${rationale}`
    : `Decision recorded: ${summary}`;
  return { subjectEventSequence: event.sequence, text, citedEvents: inputRefs };
}

function explainPayment(event: PaymentEvent): EngineeringExplanation {
  const { paymentId, amount, currency } = event.payload;
  if (event.payload.phase === "requested") {
    return {
      subjectEventSequence: event.sequence,
      text: `Payment "${paymentId}" requested for ${amount} ${currency}.`,
      citedEvents: [],
    };
  }
  const { state, masumiReference } = event.payload;
  const text = masumiReference
    ? `Payment "${paymentId}" ${state} (reference "${masumiReference}").`
    : `Payment "${paymentId}" ${state}.`;
  return { subjectEventSequence: event.sequence, text, citedEvents: [] };
}
