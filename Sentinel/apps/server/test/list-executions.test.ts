import { describe, expect, it } from "vitest";
import { buildTestApp } from "./helpers/test-app.js";

async function captureStarted(
  app: Awaited<ReturnType<typeof buildTestApp>>["app"],
  executionId: string,
  workflowId: string,
): Promise<void> {
  await app.inject({
    method: "POST",
    url: "/events",
    payload: {
      executionId,
      workflowId,
      sequence: 0,
      kind: "lifecycle",
      payload: { transition: "started" },
    },
  });
}

describe("GET /executions", () => {
  it("returns an empty list when nothing has been captured", async () => {
    const { app } = buildTestApp();
    const response = await app.inject({ method: "GET", url: "/executions" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("lists captured executions", async () => {
    const { app } = buildTestApp();
    await captureStarted(app, "019798a0-2000-7000-8000-000000000001", "workflow-a");
    await captureStarted(app, "019798a0-2000-7000-8000-000000000002", "workflow-b");

    const response = await app.inject({ method: "GET", url: "/executions" });

    expect(response.statusCode).toBe(200);
    const body: { executionId: string }[] = response.json();
    expect(body.map((e) => e.executionId).sort()).toEqual(
      ["019798a0-2000-7000-8000-000000000001", "019798a0-2000-7000-8000-000000000002"].sort(),
    );
  });

  it("filters by workflowId", async () => {
    const { app } = buildTestApp();
    await captureStarted(app, "019798a0-2000-7000-8000-000000000003", "workflow-a");
    await captureStarted(app, "019798a0-2000-7000-8000-000000000004", "workflow-b");

    const response = await app.inject({ method: "GET", url: "/executions?workflowId=workflow-a" });

    const body: { executionId: string; workflowId: string }[] = response.json();
    expect(body).toHaveLength(1);
    expect(body[0]?.workflowId).toBe("workflow-a");
  });

  it("respects the limit parameter", async () => {
    const { app } = buildTestApp();
    for (let i = 0; i < 5; i += 1) {
      await captureStarted(app, `019798a0-2000-7000-8000-00000000010${i}`, "workflow-limit");
    }

    const response = await app.inject({ method: "GET", url: "/executions?limit=2" });

    const body: unknown[] = response.json();
    expect(body).toHaveLength(2);
  });
});
