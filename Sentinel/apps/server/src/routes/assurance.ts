import type { FastifyInstance, FastifyReply } from "fastify";
import {
  JournalCorruptionError,
  ReplayIntegrityError,
  isExecutionId,
  type ExecutionId,
} from "@sentinel/domain";
import { UnknownExecutionError } from "@sentinel/execution-journal";
import type { AppDependencies } from "../composition.js";

function parseExecutionIdParam(raw: string): ExecutionId | null {
  return isExecutionId(raw) ? raw : null;
}

async function sendInvalidExecutionId(reply: FastifyReply, raw: string): Promise<void> {
  await reply.code(400).send({
    error: { code: "INVALID_EXECUTION_ID", message: `"${raw}" is not a valid ExecutionId` },
  });
}

/**
 * Maps the Replay/Verification Engine's typed errors to deterministic
 * HTTP responses. Returns `true` if the error was handled (a response
 * was sent), `false` if the caller should rethrow — mirrors the
 * `EventCaptureError` mapping in `events.ts`, but for the assurance
 * pipeline (replay, explain, export) rather than capture.
 */
async function handleAssuranceError(reply: FastifyReply, error: unknown): Promise<boolean> {
  if (error instanceof UnknownExecutionError) {
    await reply.code(404).send({ error: { code: "UNKNOWN_EXECUTION", message: error.message } });
    return true;
  }
  if (error instanceof JournalCorruptionError) {
    await reply.code(409).send({ error: { code: "JOURNAL_CORRUPTED", message: error.message } });
    return true;
  }
  if (error instanceof ReplayIntegrityError) {
    await reply.code(409).send({
      error: { code: "ARTIFACT_INTEGRITY_FAILED", message: error.message, report: error.report },
    });
    return true;
  }
  return false;
}

/**
 * The Engineering Assurance HTTP surface (Step 3.3): replay, Engineering
 * Mode explainability, and portable Execution Artifact export. Every
 * route seals/replays through `ExecutionJournalPort`, so integrity is
 * always validated before any of these three ever return data.
 */
export function registerAssuranceRoutes(
  app: FastifyInstance,
  deps: Pick<AppDependencies, "journal" | "explainabilityUseCase" | "auditExportUseCase">,
): void {
  app.post<{ Params: { id: string } }>("/executions/:id/replay", async (request, reply) => {
    const executionId = parseExecutionIdParam(request.params.id);
    if (!executionId) {
      await sendInvalidExecutionId(reply, request.params.id);
      return;
    }

    try {
      const session = await deps.journal.replay(executionId);
      await reply.code(200).send(session);
    } catch (error) {
      if (!(await handleAssuranceError(reply, error))) {
        throw error;
      }
    }
  });

  app.get<{ Params: { id: string } }>("/executions/:id/explain", async (request, reply) => {
    const executionId = parseExecutionIdParam(request.params.id);
    if (!executionId) {
      await sendInvalidExecutionId(reply, request.params.id);
      return;
    }

    try {
      const { explainability } = await deps.explainabilityUseCase.execute(executionId);
      await reply.code(200).send(explainability);
    } catch (error) {
      if (!(await handleAssuranceError(reply, error))) {
        throw error;
      }
    }
  });

  app.get<{ Params: { id: string } }>("/executions/:id/export", async (request, reply) => {
    const executionId = parseExecutionIdParam(request.params.id);
    if (!executionId) {
      await sendInvalidExecutionId(reply, request.params.id);
      return;
    }

    try {
      const bytes = await deps.auditExportUseCase.execute(executionId, "json");
      await reply
        .code(200)
        .header("content-type", "application/json")
        .header("content-disposition", `attachment; filename="sentinel-export-${executionId}.json"`)
        .send(Buffer.from(bytes));
    } catch (error) {
      if (!(await handleAssuranceError(reply, error))) {
        throw error;
      }
    }
  });
}
