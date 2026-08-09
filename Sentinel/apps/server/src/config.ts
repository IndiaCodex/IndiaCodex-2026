export type StorageDriver = "sqlite" | "memory";

export interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly logLevel: string;
  readonly storageDriver: StorageDriver;
  /** File path for the "sqlite" driver; ignored for "memory". */
  readonly sqlitePath: string;
  /**
   * `true` (the default) allows any origin — appropriate for a
   * local-only demo where the web app's origin is unpredictable
   * (whatever port Vite picked). Set `SENTINEL_CORS_ORIGIN` to a
   * specific origin (or comma-separated list) before exposing the
   * server beyond localhost.
   */
  readonly corsOrigin: string | string[] | true;
}

function parseStorageDriver(value: string | undefined): StorageDriver {
  if (value === "memory") return "memory";
  return "sqlite";
}

function parseCorsOrigin(value: string | undefined): string | string[] | true {
  if (!value) return true;
  const origins = value.split(",").map((origin) => origin.trim());
  return origins.length === 1 ? origins[0]! : origins;
}

/** Reads server configuration from the environment, with local-dev defaults. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    host: env.SENTINEL_HOST ?? "0.0.0.0",
    port: Number.parseInt(env.SENTINEL_PORT ?? "4000", 10),
    logLevel: env.SENTINEL_LOG_LEVEL ?? "info",
    storageDriver: parseStorageDriver(env.SENTINEL_STORAGE_DRIVER),
    sqlitePath: env.SENTINEL_DB_PATH ?? "./data/sentinel.db",
    corsOrigin: parseCorsOrigin(env.SENTINEL_CORS_ORIGIN),
  };
}
