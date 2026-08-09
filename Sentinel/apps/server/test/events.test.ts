import { describe, expect, it } from "vitest";
import { buildTestApp } from "./helpers/test-app.js";

describe("POST /events", () => {
  it("captures a lifecycle 'started' event and returns 201", async () => {
    const { app } = buildTestApp();
    const executionId = "019798a0-0000-7000-8000-000000000001";

    const response = await app.inject({
      method: "POST",
      url: "/events",
      payload: {
        executionId,
        workflowId: "demo-support-agent",
        sequence: 0,
        kind: "lifecycle",
        payload: { transition: "started" },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.executionId).toBe(executionId);
    expect(body.executionStatus).toBe("started");
    expect(body.sealedArtifactId).toBeNull();

    await app.close();
  });

  it("round-trips through GET /executions/:id", async () => {
    const { app } = buildTestApp();
    const executionId = "019798a0-0000-7000-8000-000000000002";

    await app.inject({
      method: "POST",
      url: "/events",
      payload: {
        executionId,
        workflowId: "demo-support-agent",
        sequence: 0,
        kind: "lifecycle",
        payload: { transition: "started" },
      },
    });

    const response = await app.inject({ method: "GET", url: `/executions/${executionId}` });
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("started");

    await app.close();
  });

  it("seals an Execution Artifact automatically on completion, retrievable via GET", async () => {
    const { app } = buildTestApp();
    const executionId = "019798a0-0000-7000-8000-000000000003";

    await app.inject({
      method: "POST",
      url: "/events",
      payload: {
        executionId,
        workflowId: "demo-support-agent",
        sequence: 0,
        kind: "lifecycle",
        payload: { transition: "started" },
      },
    });
    const completion = await app.inject({
      method: "POST",
      url: "/events",
      payload: {
        executionId,
        workflowId: "demo-support-agent",
        sequence: 1,
        kind: "lifecycle",
        payload: { transition: "completed" },
      },
    });
    expect(completion.json().sealedArtifactId).not.toBeNull();

    const artifactResponse = await app.inject({
      method: "GET",
      url: `/executions/${executionId}/artifact`,
    });
    expect(artifactResponse.statusCode).toBe(200);
    expect(artifactResponse.json().rootHash).toBeDefined();

    await app.close();
  });

  it("rejects an invalid envelope with 400 and a deterministic error code", async () => {
    const { app } = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/events",
      payload: { executionId: "", workflowId: "bad slug", sequence: -1 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_ENVELOPE");

    await app.close();
  });

  it("rejects an event for an execution that hasn't started with 404", async () => {
    const { app } = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/events",
      payload: {
        executionId: "019798a0-0000-7000-8000-000000000004",
        workflowId: "demo-support-agent",
        sequence: 0,
        kind: "lifecycle",
        payload: { transition: "completed" },
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("UNKNOWN_EXECUTION");

    await app.close();
  });

  it("rejects an out-of-order sequence with 422", async () => {
    const { app } = buildTestApp();
    const executionId = "019798a0-0000-7000-8000-000000000005";

    await app.inject({
      method: "POST",
      url: "/events",
      payload: {
        executionId,
        workflowId: "demo-support-agent",
        sequence: 0,
        kind: "lifecycle",
        payload: { transition: "started" },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/events",
      payload: {
        executionId,
        workflowId: "demo-support-agent",
        sequence: 9,
        kind: "lifecycle",
        payload: { transition: "retried" },
      },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe("JOURNAL_INVARIANT_VIOLATION");

    await app.close();
  });

  it("returns 404 for an unknown execution id shaped correctly", async () => {
    const { app } = buildTestApp();
    const response = await app.inject({
      method: "GET",
      url: "/executions/019798a0-0000-7000-8000-00000000ffff",
    });
    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it("returns 400 for a malformed execution id", async () => {
    const { app } = buildTestApp();
    const response = await app.inject({ method: "GET", url: "/executions/not-a-uuid" });
    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
