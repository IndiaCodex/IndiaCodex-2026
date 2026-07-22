import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import type { AppDependencies } from "./composition.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerEventRoutes } from "./routes/events.js";
import { registerExecutionRoutes } from "./routes/executions.js";
import { registerAssuranceRoutes } from "./routes/assurance.js";

export interface BuildAppOptions {
  readonly logLevel?: string;
  readonly corsOrigin?: string | string[] | boolean;
}

/**
 * Registers every route against the given dependencies. `server.ts`
 * (production) and integration tests both call this the same way, with
 * different `AppDependencies` — real adapters in one case, in-memory
 * ones in the other — so route handlers are exercised identically
 * either way. `options` defaults to permissive-CORS/info-level logging,
 * which is what every test relies on implicitly; `server.ts` passes the
 * real `ServerConfig` through explicitly.
 */
export function buildApp(deps: AppDependencies, options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: { level: options.logLevel ?? "info" },
  });

  void app.register(cors, { origin: options.corsOrigin ?? true });

  registerHealthRoutes(app);
  registerEventRoutes(app, deps);
  registerExecutionRoutes(app, deps);
  registerAssuranceRoutes(app, deps);

  return app;
}
