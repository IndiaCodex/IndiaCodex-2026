import type { FastifyInstance } from "fastify";
import { isExecutionId, type ExecutionId, type ExecutionSearchQuery } from "@sentinel/domain";
import type { AppDependencies } from "../composition.js";

function parseExecutionIdParam(raw: string): ExecutionId | null {
  return isExecutionId(raw) ? raw : null;
}

interface ListExecutionsQuery {
  readonly workflowId?: string;
  readonly correlationId?: string;
  readonly traceId?: string;
  readonly limit?: string;
}

/**
 * Read-back for what Execution Capture wrote: a list endpoint for the
 * Executions/Dashboard pages (Step 3.4), plus the two single-execution
 * lookups. Filtering by `workflowId`/`traceId`/`correlationId` is the
 * StoragePort contract (ADR-0005 identity fields); status/text search
 * and sorting are deliberately left to the client — the demo's dataset
 * is small enough that fetching a bounded page and filtering it in the
 * UI is simpler and honest, rather than growing StoragePort's query
 * surface for a scale this project isn't operating at yet.
 */
export function registerExecutionRoutes(
  app: FastifyInstance,
  deps: Pick<AppDependencies, "storage">,
): void {
  app.get<{ Querystring: ListExecutionsQuery }>("/executions", async (request, reply) => {
    const { workflowId, correlationId, traceId, limit } = request.query;
    const query: ExecutionSearchQuery = {
      ...(workflowId
        ? { workflowId: workflowId as NonNullable<ExecutionSearchQuery["workflowId"]> }
        : {}),
      ...(correlationId
        ? { correlationId: correlationId as NonNullable<ExecutionSearchQuery["correlationId"]> }
        : {}),
      ...(traceId ? { traceId: traceId as NonNullable<ExecutionSearchQuery["traceId"]> } : {}),
      limit: limit ? Number.parseInt(limit, 10) : 100,
    };

    const executions = await deps.storage.searchExecutions(query);
    await reply.send(executions);
  });

  app.get<{ Params: { id: string } }>("/executions/:id", async (request, reply) => {
    const executionId = parseExecutionIdParam(request.params.id);
    if (!executionId) {
      await reply.code(400).send({
        error: {
          code: "INVALID_EXECUTION_ID",
          message: `"${request.params.id}" is not a valid ExecutionId`,
        },
      });
      return;
    }

    const execution = await deps.storage.getExecution(executionId);
    if (!execution) {
      await reply
        .code(404)
        .send({ error: { code: "NOT_FOUND", message: `No Execution "${executionId}"` } });
      return;
    }
    await reply.send(execution);
  });

  app.get<{ Params: { id: string } }>("/executions/:id/artifact", async (request, reply) => {
    const executionId = parseExecutionIdParam(request.params.id);
    if (!executionId) {
      await reply.code(400).send({
        error: {
          code: "INVALID_EXECUTION_ID",
          message: `"${request.params.id}" is not a valid ExecutionId`,
        },
      });
      return;
    }

    const artifact = await deps.storage.getArtifact(executionId);
    if (!artifact) {
      await reply.code(404).send({
        error: {
          code: "NOT_FOUND",
          message: `No sealed Execution Artifact for "${executionId}"`,
        },
      });
      return;
    }
    await reply.send(artifact);
  });
}
