import type { ExecutionAuditExport, ExportFormat, ExportPort } from "@sentinel/domain";
import { UnsupportedExportFormatError } from "./unsupported-export-format-error.js";

/**
 * Implements `ExportPort` for portable JSON (ADR-0004): the sole
 * hackathon MVP format. Renders the complete `ExecutionAuditExport`
 * bundle — artifact, hash chain, verification, replay, explainability —
 * as pretty-printed, UTF-8 encoded JSON, self-contained and readable
 * without any Sentinel-specific tooling.
 */
export class JsonExportAdapter implements ExportPort {
  // eslint-disable-next-line @typescript-eslint/require-await -- must return a rejected Promise, not throw synchronously, to honor the ExportPort contract
  async render(bundle: ExecutionAuditExport, format: ExportFormat): Promise<Uint8Array> {
    if (format !== "json") {
      throw new UnsupportedExportFormatError(format);
    }
    const json = JSON.stringify(bundle, null, 2);
    return new TextEncoder().encode(json);
  }
}
