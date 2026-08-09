import type { ExecutionAuditExport } from "../export/execution-audit-export.js";

/** MVP supports JSON only; PDF is a later addition, not an architecture change. */
export type ExportFormat = "json";

/**
 * Renders a complete `ExecutionAuditExport` bundle — artifact, hash
 * chain, verification, replay, and explainability — into a
 * distributable format (ADR-0004, extended Step 3.3 to cover the full
 * audit bundle rather than the bare artifact alone).
 */
export interface ExportPort {
  render(bundle: ExecutionAuditExport, format: ExportFormat): Promise<Uint8Array>;
}
