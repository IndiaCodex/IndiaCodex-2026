import { describe, expect, it } from "vitest";
import { EXECUTION_ARTIFACT_SCHEMA_VERSION } from "@sentinel/domain";
import { buildTestApp } from "./helpers/test-app.js";

describe("GET /health", () => {
  it("reports ok status and the current artifact schema version", async () => {
    const { app } = buildTestApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      service: "sentinel-server",
      artifactSchemaVersion: EXECUTION_ARTIFACT_SCHEMA_VERSION,
    });

    await app.close();
  });
});
