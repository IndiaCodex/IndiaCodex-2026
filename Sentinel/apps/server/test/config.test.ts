import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("defaults to permissive local-dev settings when nothing is set", () => {
    const config = loadConfig({});

    expect(config.host).toBe("0.0.0.0");
    expect(config.port).toBe(4000);
    expect(config.logLevel).toBe("info");
    expect(config.storageDriver).toBe("sqlite");
    expect(config.sqlitePath).toBe("./data/sentinel.db");
    expect(config.corsOrigin).toBe(true);
  });

  it("reads every value from the environment when set", () => {
    const config = loadConfig({
      SENTINEL_HOST: "127.0.0.1",
      SENTINEL_PORT: "8080",
      SENTINEL_LOG_LEVEL: "debug",
      SENTINEL_STORAGE_DRIVER: "memory",
      SENTINEL_DB_PATH: "/tmp/custom.db",
      SENTINEL_CORS_ORIGIN: "https://sentinel.example.com",
    });

    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe(8080);
    expect(config.logLevel).toBe("debug");
    expect(config.storageDriver).toBe("memory");
    expect(config.sqlitePath).toBe("/tmp/custom.db");
    expect(config.corsOrigin).toBe("https://sentinel.example.com");
  });

  it("parses a comma-separated CORS origin list", () => {
    const config = loadConfig({
      SENTINEL_CORS_ORIGIN: "https://a.example.com, https://b.example.com",
    });

    expect(config.corsOrigin).toEqual(["https://a.example.com", "https://b.example.com"]);
  });

  it("falls back to the sqlite driver for any unrecognized value", () => {
    const config = loadConfig({ SENTINEL_STORAGE_DRIVER: "postgres" });
    expect(config.storageDriver).toBe("sqlite");
  });
});
