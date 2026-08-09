import type { CaptureEventCommand } from "@sentinel/application";
import { makeClock } from "./timeline-clock.js";

/**
 * Demo scenario 3 (Step 3.5): every tool call and decision succeeds, but
 * the payment itself is declined — a failure that originates in the
 * Payment Timeline specifically, not in tool execution. Distinguishes
 * "Payment Flow shows a failure" from "Tool Flow shows a failure"
 * (scenario 2) in the Explainability tab.
 *
 * `state: "failed"` is what the agent itself observed (Masumi declined
 * the charge); Masumi enrichment still runs during capture
 * (`MasumiAdapterPort.enrichPayment`) to attach a reference for the
 * declined attempt, exactly as it would for a confirmed one.
 */
export const PAYMENT_FAILURE_EXECUTION_ID = "01977000-0000-7000-8000-000000000003";
export const PAYMENT_FAILURE_WORKFLOW_ID = "subscription-renewal-agent";

const at = makeClock("2026-07-12T08:00:00.000Z");

export function buildPaymentFailureWorkflowCommands(): CaptureEventCommand[] {
  const paymentId = "pay_sub_renewal_552";
  const amount = "9.99";
  const currency = "ADA";

  return [
    {
      executionId: PAYMENT_FAILURE_EXECUTION_ID,
      workflowId: PAYMENT_FAILURE_WORKFLOW_ID,
      sequence: 0,
      occurredAt: at(0),
      kind: "lifecycle",
      payload: { transition: "started" },
      metadata: {
        customerRequest: "Renew subscription sub_552 on the annual plan.",
        channel: "billing-cron",
      },
    },
    {
      executionId: PAYMENT_FAILURE_EXECUTION_ID,
      workflowId: PAYMENT_FAILURE_WORKFLOW_ID,
      sequence: 1,
      occurredAt: at(1),
      kind: "tool",
      payload: {
        phase: "invoked",
        toolName: "billing_account_lookup",
        arguments: { subscriptionId: "sub_552" },
      },
    },
    {
      executionId: PAYMENT_FAILURE_EXECUTION_ID,
      workflowId: PAYMENT_FAILURE_WORKFLOW_ID,
      sequence: 2,
      occurredAt: at(2),
      kind: "tool",
      payload: {
        phase: "completed",
        toolName: "billing_account_lookup",
        arguments: { subscriptionId: "sub_552" },
        result: { plan: "annual", renewsOn: "2026-07-12", paymentMethod: "card_ending_4242" },
      },
      snapshot: {
        kind: "tool-call",
        request: { subscriptionId: "sub_552" },
        response: { plan: "annual", renewsOn: "2026-07-12", paymentMethod: "card_ending_4242" },
        capturedAt: at(2),
      },
    },
    {
      executionId: PAYMENT_FAILURE_EXECUTION_ID,
      workflowId: PAYMENT_FAILURE_WORKFLOW_ID,
      sequence: 3,
      occurredAt: at(3),
      kind: "decision",
      payload: {
        summary: "Proceed with annual renewal charge of 9.99 ADA",
        rationale: "Subscription is active and in good standing; charge the plan's renewal price.",
        inputRefs: [2],
      },
      snapshot: {
        kind: "llm-call",
        request: { prompt: "Given the billing lookup, should we charge the renewal?" },
        response: { text: "Yes — charge 9.99 ADA for the annual plan." },
        capturedAt: at(3),
      },
    },
    {
      executionId: PAYMENT_FAILURE_EXECUTION_ID,
      workflowId: PAYMENT_FAILURE_WORKFLOW_ID,
      sequence: 4,
      occurredAt: at(4),
      kind: "payment",
      payload: { phase: "requested", paymentId, amount, currency },
    },
    {
      executionId: PAYMENT_FAILURE_EXECUTION_ID,
      workflowId: PAYMENT_FAILURE_WORKFLOW_ID,
      sequence: 5,
      occurredAt: at(7),
      kind: "payment",
      payload: {
        phase: "completed",
        paymentId,
        amount,
        currency,
        state: "failed",
      },
      snapshot: {
        kind: "external-api-call",
        request: { paymentId, amount, currency },
        response: { paymentId, amount, currency, state: "failed", reason: "insufficient_funds" },
        capturedAt: at(7),
      },
    },
    {
      executionId: PAYMENT_FAILURE_EXECUTION_ID,
      workflowId: PAYMENT_FAILURE_WORKFLOW_ID,
      sequence: 6,
      occurredAt: at(8),
      kind: "lifecycle",
      payload: {
        transition: "failed",
        failureReason: `Payment ${paymentId} declined by Masumi Payment Service — insufficient funds`,
      },
    },
  ];
}
