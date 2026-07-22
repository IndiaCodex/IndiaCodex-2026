import type { FastifyInstance } from "fastify";
import { EventCaptureError, type EventRejectionReason } from "@sentinel/application";
import type { AppDependencies } from "../composition.js";

const STATUS_BY_REASON: Record<EventRejectionReason, number> = {
  INVALID_ENVELOPE: 400,
  INVALID_PAYLOAD: 400,
  UNKNOWN_EXECUTION: 404,
  IDENTITY_MISMATCH: 409,
  EXECUTION_ALREADY_TERMINAL: 409,
  JOURNAL_INVARIANT_VIOLATION: 422,
};

/**
 * The Execution Capture pipeline's HTTP boundary: parses/validates one
 * incoming event and hands it to `CaptureEventUseCase`. Rejections are
 * deterministic — `EventCaptureError.reason` maps 1:1 to a stable HTTP
 * status and a `{ error: { code, message } }` body, so a caller can
 * branch on `code` without parsing prose.
 */
export function registerEventRoutes(
  app: FastifyInstance,
  deps: Pick<AppDependencies, "captureEventUseCase">,
): void {
  app.post("/events", async (request, reply) => {
    try {
      const result = await deps.captureEventUseCase.execute(request.body);
      await reply.code(201).send({
        executionId: result.execution.executionId,
        sequence: result.entry.sequence,
        entryHash: result.entry.entryHash,
        executionStatus: result.execution.status,
        sealedArtifactId: result.sealedArtifact?.artifactId ?? null,
      });
    } catch (error) {
      if (error instanceof EventCaptureError) {
        await reply.code(STATUS_BY_REASON[error.reason]).send({
          error: { code: error.reason, message: error.message, details: error.details ?? null },
        });
        return;
      }
      throw error;
    }
  });
}
