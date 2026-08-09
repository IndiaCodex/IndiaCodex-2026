import type { FastifyInstance } from "fastify";
import {
  CaptureEventUseCase,
  GenerateExecutionAuditExportUseCase,
  GenerateExplainabilityReportUseCase,
} from "@sentinel/application";
import { SentinelExecutionJournal } from "@sentinel/execution-journal";
import { InMemoryStorage } from "@sentinel/storage-memory";
import { MockMasumiAdapter } from "@sentinel/adapter-masumi";
import { JsonExportAdapter } from "@sentinel/export-json";
import { buildApp } from "../../src/app.js";
import type { AppDependencies } from "../../src/composition.js";

/** Builds a fully wired app against fresh in-memory storage — fast and isolated per test. */
export function buildTestApp(): { app: FastifyInstance; deps: AppDependencies } {
  const storage = new InMemoryStorage();
  const journal = new SentinelExecutionJournal(storage, "test@0.0.0");
  const masumiAdapter = new MockMasumiAdapter();
  const explainabilityUseCase = new GenerateExplainabilityReportUseCase(journal);
  const exportPort = new JsonExportAdapter();
  const deps: AppDependencies = {
    storage,
    journal,
    masumiAdapter,
    exportPort,
    captureEventUseCase: new CaptureEventUseCase(storage, journal, masumiAdapter),
    explainabilityUseCase,
    auditExportUseCase: new GenerateExecutionAuditExportUseCase(explainabilityUseCase, exportPort),
  };
  return { app: buildApp(deps), deps };
}
