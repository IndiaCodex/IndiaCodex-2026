import type { CaptureEventCommand } from "@sentinel/application";
import { makeClock } from "./timeline-clock.js";

/**
 * Demo scenario 2 (Step 3.5): a tool failure that takes the whole
 * Execution down with it — exercises Failure Analysis and a "failed"
 * entry in the Explainability tab's Tool Flow, distinct from the
 * canonical workflow's all-success path.
 */
export const TOOL_FAILURE_EXECUTION_ID = "01977000-0000-7000-8000-000000000002";
export const TOOL_FAILURE_WORKFLOW_ID = "inventory-restock-agent";

const at = makeClock("2026-07-11T14:00:00.000Z");

export function buildToolFailureWorkflowCommands(): CaptureEventCommand[] {
  return [
    {
      executionId: TOOL_FAILURE_EXECUTION_ID,
      workflowId: TOOL_FAILURE_WORKFLOW_ID,
      sequence: 0,
      occurredAt: at(0),
      kind: "lifecycle",
      payload: { transition: "started" },
      metadata: {
        customerRequest: "Restock warehouse #4 for SKU-8821 before Friday's shipment.",
        channel: "scheduled-job",
      },
    },
    {
      executionId: TOOL_FAILURE_EXECUTION_ID,
      workflowId: TOOL_FAILURE_WORKFLOW_ID,
      sequence: 1,
      occurredAt: at(2),
      kind: "tool",
      payload: {
        phase: "invoked",
        toolName: "supplier_inventory_check",
        arguments: { sku: "SKU-8821", supplierId: "sup-204" },
      },
    },
    {
      executionId: TOOL_FAILURE_EXECUTION_ID,
      workflowId: TOOL_FAILURE_WORKFLOW_ID,
      sequence: 2,
      occurredAt: at(32),
      kind: "tool",
      payload: {
        phase: "completed",
        toolName: "supplier_inventory_check",
        arguments: { sku: "SKU-8821", supplierId: "sup-204" },
        result: null,
        error: "Connection timeout after 30s reaching supplier API (sup-204)",
      },
      snapshot: {
        kind: "external-api-call",
        request: { sku: "SKU-8821", supplierId: "sup-204" },
        response: { error: "ETIMEDOUT", detail: "Connection timeout after 30s" },
        capturedAt: at(32),
      },
    },
    {
      executionId: TOOL_FAILURE_EXECUTION_ID,
      workflowId: TOOL_FAILURE_WORKFLOW_ID,
      sequence: 3,
      occurredAt: at(33),
      kind: "lifecycle",
      payload: {
        transition: "failed",
        failureReason:
          "Unable to verify inventory levels: supplier_inventory_check timed out reaching sup-204",
      },
    },
  ];
}
