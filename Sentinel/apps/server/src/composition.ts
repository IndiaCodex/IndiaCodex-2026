import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { ExportPort, MasumiAdapterPort, StoragePort } from "@sentinel/domain";
import {
  CaptureEventUseCase,
  GenerateExecutionAuditExportUseCase,
  GenerateExplainabilityReportUseCase,
} from "@sentinel/application";
import { SentinelExecutionJournal } from "@sentinel/execution-journal";
import { InMemoryStorage } from "@sentinel/storage-memory";
import { SqliteStorage } from "@sentinel/storage-sqlite";
import { MockMasumiAdapter } from "@sentinel/adapter-masumi";
import { JsonExportAdapter } from "@sentinel/export-json";
import type { ServerConfig } from "./config.js";

export interface AppDependencies {
  readonly storage: StoragePort;
  readonly journal: SentinelExecutionJournal;
  readonly masumiAdapter: MasumiAdapterPort;
  readonly exportPort: ExportPort;
  readonly captureEventUseCase: CaptureEventUseCase;
  readonly explainabilityUseCase: GenerateExplainabilityReportUseCase;
  readonly auditExportUseCase: GenerateExecutionAuditExportUseCase;
  /** Present only for adapters that hold an OS resource (e.g. an open SQLite file handle). */
  readonly close?: () => void;
}

function buildStorage(config: ServerConfig): StoragePort & { close?: () => void } {
  if (config.storageDriver === "memory") {
    return new InMemoryStorage();
  }
  if (config.sqlitePath !== ":memory:") {
    mkdirSync(dirname(config.sqlitePath), { recursive: true });
  }
  return new SqliteStorage(config.sqlitePath);
}

/**
 * The composition root: the one place concrete adapters are
 * instantiated and wired into application use cases via domain ports.
 * `app.ts`, the demo seed script, and tests all depend only on this
 * function's return shape (`AppDependencies`), never on `SqliteStorage`,
 * `MockMasumiAdapter`, or `JsonExportAdapter` directly.
 */
export function buildDependencies(config: ServerConfig): AppDependencies {
  const storage = buildStorage(config);
  const journal = new SentinelExecutionJournal(storage, "sentinel-server@0.1.0");
  const masumiAdapter = new MockMasumiAdapter();
  const exportPort = new JsonExportAdapter();

  const captureEventUseCase = new CaptureEventUseCase(storage, journal, masumiAdapter);
  const explainabilityUseCase = new GenerateExplainabilityReportUseCase(journal);
  const auditExportUseCase = new GenerateExecutionAuditExportUseCase(
    explainabilityUseCase,
    exportPort,
  );

  return {
    storage,
    journal,
    masumiAdapter,
    exportPort,
    captureEventUseCase,
    explainabilityUseCase,
    auditExportUseCase,
    ...(storage.close ? { close: () => storage.close?.() } : {}),
  };
}
