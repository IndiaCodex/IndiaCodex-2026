import type { FastifyInstance } from "fastify";
import { EXECUTION_ARTIFACT_SCHEMA_VERSION } from "@sentinel/domain";

/**
 * Liveness/version endpoint. Reports the Execution Artifact schema
 * version alongside process status so a caller (or a CI smoke test) can
 * detect a schema mismatch without inspecting an actual artifact.
 */
export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/health", () => ({
    status: "ok" as const,
    service: "sentinel-server",
    artifactSchemaVersion: EXECUTION_ARTIFACT_SCHEMA_VERSION,
    uptimeSeconds: Math.round(process.uptime()),
  }));
}
