import type { CaptureEventCommand } from "@sentinel/application";
import { makeClock } from "./timeline-clock.js";

/**
 * Demo scenario 4 (Step 3.5): an execution that simply stops — no
 * `completed` or `failed` lifecycle event ever arrives (a crashed
 * worker, a killed process, a lost connection). Nothing in Sentinel
 * requires a terminal event to exist: the Journal can still be sealed,
 * replayed, verified, explained, and exported from exactly what was
 * captured before the interruption. That's the point of this
 * scenario — Engineering Assurance for a *stuck* execution is exactly
 * when it matters most, not a special case Sentinel degrades on.
 */
export const INTERRUPTED_EXECUTION_ID = "01977000-0000-7000-8000-000000000004";
export const INTERRUPTED_WORKFLOW_ID = "document-processing-agent";

const at = makeClock("2026-07-13T16:00:00.000Z");

export function buildInterruptedWorkflowCommands(): CaptureEventCommand[] {
  return [
    {
      executionId: INTERRUPTED_EXECUTION_ID,
      workflowId: INTERRUPTED_WORKFLOW_ID,
      sequence: 0,
      occurredAt: at(0),
      kind: "lifecycle",
      payload: { transition: "started" },
      metadata: {
        customerRequest: "Extract line items from invoice-88231.pdf and reconcile against PO-4471.",
        channel: "upload-webhook",
      },
    },
    {
      executionId: INTERRUPTED_EXECUTION_ID,
      workflowId: INTERRUPTED_WORKFLOW_ID,
      sequence: 1,
      occurredAt: at(1),
      kind: "tool",
      payload: {
        phase: "invoked",
        toolName: "ocr_extract",
        arguments: { documentUrl: "s3://uploads/invoice-88231.pdf" },
      },
    },
    // No further events: the worker running this agent was killed
    // (deploy, OOM, timeout — Sentinel doesn't need to know which)
    // before ocr_extract completed. This Execution stays "running"
    // forever, exactly as it would in production.
  ];
}
