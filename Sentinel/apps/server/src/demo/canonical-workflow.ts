import type { CaptureEventCommand } from "@sentinel/application";
import { makeClock } from "./timeline-clock.js";

/**
 * The canonical demo execution (Step 3.2 deliverable): a realistic,
 * complete Masumi agent workflow —
 *
 *   Customer Request -> Agent Starts -> Knowledge Retrieval ->
 *   External Tool Call -> Decision Recorded -> Payment Requested ->
 *   Payment Confirmed -> Execution Completed
 *
 * — captured through the real Execution Capture pipeline (no
 * shortcuts: every event here is validated and hash-chained exactly
 * like a live agent's would be). This becomes the fixture the Replay
 * Engine, Explainability, Export, and UI milestones build against.
 *
 * "Customer Request" isn't a Sentinel Event on its own — it's the
 * upstream trigger that caused the agent to start, so it's carried as
 * metadata on the `started` lifecycle event rather than invented as a
 * ninth event kind.
 *
 * The payment `completed` event below intentionally omits
 * `masumiReference` — `CaptureEventUseCase` fills it in live via
 * `MasumiAdapterPort.enrichPayment` as the event is captured (the same
 * path a real agent runtime's payment event goes through), rather than
 * this fixture pre-computing it.
 */
export const CANONICAL_EXECUTION_ID = "01977000-0000-7000-8000-000000000001";
export const CANONICAL_WORKFLOW_ID = "customer-refund-agent";

const at = makeClock("2026-07-10T09:00:00.000Z");

export function buildCanonicalWorkflowCommands(): CaptureEventCommand[] {
  const paymentId = "pay_ch_2_refund";
  const amount = "49.99";
  const currency = "ADA";

  const commands: CaptureEventCommand[] = [
    {
      executionId: CANONICAL_EXECUTION_ID,
      workflowId: CANONICAL_WORKFLOW_ID,
      sequence: 0,
      occurredAt: at(0),
      kind: "lifecycle",
      payload: { transition: "started" },
      metadata: {
        customerRequest: "I was charged twice for order #4471, please refund the duplicate charge.",
        channel: "support-chat",
      },
    },
    {
      executionId: CANONICAL_EXECUTION_ID,
      workflowId: CANONICAL_WORKFLOW_ID,
      sequence: 1,
      occurredAt: at(2),
      kind: "tool",
      payload: {
        phase: "invoked",
        toolName: "knowledge_base_search",
        arguments: { query: "duplicate charge refund policy" },
      },
    },
    {
      executionId: CANONICAL_EXECUTION_ID,
      workflowId: CANONICAL_WORKFLOW_ID,
      sequence: 2,
      occurredAt: at(3),
      kind: "tool",
      payload: {
        phase: "completed",
        toolName: "knowledge_base_search",
        arguments: { query: "duplicate charge refund policy" },
        result: { articles: [{ id: "kb-042", title: "Duplicate Charge Refund Policy" }] },
      },
      snapshot: {
        kind: "tool-call",
        request: { query: "duplicate charge refund policy" },
        response: { articles: [{ id: "kb-042", title: "Duplicate Charge Refund Policy" }] },
        capturedAt: at(3),
      },
    },
    {
      executionId: CANONICAL_EXECUTION_ID,
      workflowId: CANONICAL_WORKFLOW_ID,
      sequence: 3,
      occurredAt: at(5),
      kind: "tool",
      payload: {
        phase: "invoked",
        toolName: "billing_system_lookup",
        arguments: { orderId: "4471" },
      },
    },
    {
      executionId: CANONICAL_EXECUTION_ID,
      workflowId: CANONICAL_WORKFLOW_ID,
      sequence: 4,
      occurredAt: at(7),
      kind: "tool",
      payload: {
        phase: "completed",
        toolName: "billing_system_lookup",
        arguments: { orderId: "4471" },
        result: {
          orderId: "4471",
          charges: [
            { chargeId: "ch_1", amount: "49.99" },
            { chargeId: "ch_2", amount: "49.99" },
          ],
          duplicate: true,
        },
      },
      snapshot: {
        kind: "external-api-call",
        request: { orderId: "4471" },
        response: {
          charges: [
            { chargeId: "ch_1", amount: "49.99" },
            { chargeId: "ch_2", amount: "49.99" },
          ],
          duplicate: true,
        },
        capturedAt: at(7),
      },
    },
    {
      executionId: CANONICAL_EXECUTION_ID,
      workflowId: CANONICAL_WORKFLOW_ID,
      sequence: 5,
      occurredAt: at(9),
      kind: "decision",
      payload: {
        summary: "Approve refund of duplicate charge ch_2 ($49.99)",
        rationale:
          "Billing system confirms two identical charges for order 4471; policy kb-042 authorizes refunding duplicate charges without escalation.",
        inputRefs: [2, 4],
      },
      snapshot: {
        kind: "llm-call",
        request: {
          prompt:
            "Given the knowledge base result and the billing lookup, should we refund the duplicate charge?",
        },
        response: { text: "Yes — refund charge ch_2 for $49.99." },
        capturedAt: at(9),
      },
    },
    {
      executionId: CANONICAL_EXECUTION_ID,
      workflowId: CANONICAL_WORKFLOW_ID,
      sequence: 6,
      occurredAt: at(10),
      kind: "payment",
      payload: { phase: "requested", paymentId, amount, currency },
    },
    {
      executionId: CANONICAL_EXECUTION_ID,
      workflowId: CANONICAL_WORKFLOW_ID,
      sequence: 7,
      occurredAt: at(13),
      kind: "payment",
      payload: {
        phase: "completed",
        paymentId,
        amount,
        currency,
        state: "confirmed",
      },
      snapshot: {
        kind: "external-api-call",
        request: { paymentId, amount, currency },
        response: { paymentId, amount, currency, state: "confirmed" },
        capturedAt: at(13),
      },
    },
    {
      executionId: CANONICAL_EXECUTION_ID,
      workflowId: CANONICAL_WORKFLOW_ID,
      sequence: 8,
      occurredAt: at(14),
      kind: "lifecycle",
      payload: { transition: "completed" },
    },
  ];

  return commands;
}
