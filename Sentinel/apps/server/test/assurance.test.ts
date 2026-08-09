import { describe, expect, it } from "vitest";
import { buildTestApp } from "./helpers/test-app.js";

const EXECUTION_ID = "019798a0-1000-7000-8000-000000000001";
const OTHER_EXECUTION_ID = "019798a0-1000-7000-8000-000000000002";
const WORKFLOW_ID = "assurance-test-workflow";

async function captureCompletedExecution(
  app: Awaited<ReturnType<typeof buildTestApp>>["app"],
  executionId: string,
): Promise<void> {
  await app.inject({
    method: "POST",
    url: "/events",
    payload: {
      executionId,
      workflowId: WORKFLOW_ID,
      sequence: 0,
      kind: "lifecycle",
      payload: { transition: "started" },
    },
  });
  await app.inject({
    method: "POST",
    url: "/events",
    payload: {
      executionId,
      workflowId: WORKFLOW_ID,
      sequence: 1,
      kind: "tool",
      payload: { phase: "invoked", toolName: "kb_search", arguments: { query: "refund" } },
    },
  });
  await app.inject({
    method: "POST",
    url: "/events",
    payload: {
      executionId,
      workflowId: WORKFLOW_ID,
      sequence: 2,
      kind: "tool",
      payload: {
        phase: "completed",
        toolName: "kb_search",
        arguments: { query: "refund" },
        result: { articles: ["kb-1"] },
      },
      snapshot: {
        kind: "tool-call",
        request: { query: "refund" },
        response: { articles: ["kb-1"] },
      },
    },
  });
  await app.inject({
    method: "POST",
    url: "/events",
    payload: {
      executionId,
      workflowId: WORKFLOW_ID,
      sequence: 3,
      kind: "lifecycle",
      payload: { transition: "completed" },
    },
  });
}

describe("POST /executions/:id/replay", () => {
  it("replays a captured execution and returns a valid ReplaySession", async () => {
    const { app } = buildTestApp();
    await captureCompletedExecution(app, EXECUTION_ID);

    const response = await app.inject({
      method: "POST",
      url: `/executions/${EXECUTION_ID}/replay`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.sourceExecutionId).toBe(EXECUTION_ID);
    expect(body.fidelity).toBe("identical");
    expect(body.verification.valid).toBe(true);
    expect(body.replayedTimeline).toHaveLength(4);

    await app.close();
  });

  it("returns 404 for an execution that was never captured", async () => {
    const { app } = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: `/executions/${OTHER_EXECUTION_ID}/replay`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("UNKNOWN_EXECUTION");

    await app.close();
  });

  it("returns 400 for a malformed execution id", async () => {
    const { app } = buildTestApp();
    const response = await app.inject({ method: "POST", url: "/executions/not-a-uuid/replay" });
    expect(response.statusCode).toBe(400);
    await app.close();
  });
});

describe("GET /executions/:id/explain", () => {
  it("returns a deterministic, structured explainability report", async () => {
    const { app } = buildTestApp();
    await captureCompletedExecution(app, EXECUTION_ID);

    const response = await app.inject({
      method: "GET",
      url: `/executions/${EXECUTION_ID}/explain`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.executionSummary.outcome).toBe("completed");
    expect(body.executionSummary.toolInvocationCount).toBe(1);
    expect(body.timelineSummary).toHaveLength(4);
    expect(body.toolExecutionSequence).toHaveLength(1);
    expect(body.toolExecutionSequence[0].outcome).toBe("succeeded");
    expect(body.journalIntegrity.intact).toBe(true);
    expect(body.replayValidation.replayed).toBe(true);
  });

  it("returns 404 for an unknown execution", async () => {
    const { app } = buildTestApp();
    const response = await app.inject({
      method: "GET",
      url: `/executions/${OTHER_EXECUTION_ID}/explain`,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe("GET /executions/:id/export", () => {
  it("returns a complete, self-contained audit export as a downloadable JSON file", async () => {
    const { app } = buildTestApp();
    await captureCompletedExecution(app, EXECUTION_ID);

    const response = await app.inject({ method: "GET", url: `/executions/${EXECUTION_ID}/export` });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.headers["content-disposition"]).toContain("attachment");
    expect(response.headers["content-disposition"]).toContain(EXECUTION_ID);

    const bundle = response.json();
    expect(bundle.artifact.executionId).toBe(EXECUTION_ID);
    expect(bundle.verification.valid).toBe(true);
    expect(bundle.replay.fidelity).toBe("identical");
    expect(bundle.explainability.executionSummary.outcome).toBe("completed");
    expect(bundle.hashChain.length).toBeGreaterThan(0);
    expect(bundle.hashChain[bundle.hashChain.length - 1].entryHash).toBe(bundle.artifact.rootHash);
  });

  it("returns 404 for an unknown execution", async () => {
    const { app } = buildTestApp();
    const response = await app.inject({
      method: "GET",
      url: `/executions/${OTHER_EXECUTION_ID}/export`,
    });
    expect(response.statusCode).toBe(404);
  });
});
