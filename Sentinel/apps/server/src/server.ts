import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { buildDependencies } from "./composition.js";

const config = loadConfig();
const deps = buildDependencies(config);
const app = buildApp(deps, { logLevel: config.logLevel, corsOrigin: config.corsOrigin });

app
  .listen({ host: config.host, port: config.port })
  .then(() => {
    app.log.info(
      `Sentinel server listening on ${config.host}:${config.port} (storage: ${config.storageDriver})`,
    );
  })
  .catch((error: unknown) => {
    app.log.error(error);
    process.exit(1);
  });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void app.close().finally(() => {
      deps.close?.();
      process.exit(0);
    });
  });
}
