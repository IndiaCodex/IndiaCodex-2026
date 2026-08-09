import { getAuditExportDownloadUrl } from "../../lib/api-client.js";
import { useAuditExport } from "../../lib/queries.js";
import { Card, CardHeader } from "../../components/Card.js";
import { CopyButton } from "../../components/CopyButton.js";
import { JsonBlock } from "../../components/JsonBlock.js";
import { Mono } from "../../components/Mono.js";
import { QueryBoundary } from "../../components/QueryState.js";
import { formatTimestamp } from "../../lib/format.js";
import { useExecutionIdParam } from "./useExecutionIdParam.js";

export function ArtifactPage() {
  const executionId = useExecutionIdParam();
  const { data: bundle, isLoading, error } = useAuditExport(executionId, true);

  return (
    <QueryBoundary isLoading={isLoading} error={error}>
      {bundle && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Execution Artifact Export"
              subtitle="Self-contained — replay, verification, and audit require only this file."
              action={
                <a
                  href={getAuditExportDownloadUrl(executionId)}
                  download={`sentinel-export-${executionId}.json`}
                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-ink hover:opacity-90"
                >
                  Download JSON
                </a>
              }
            />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-ink-muted">Export schema</dt>
                <dd className="mt-0.5 text-ink-secondary">{bundle.exportSchemaVersion}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Artifact schema</dt>
                <dd className="mt-0.5 text-ink-secondary">{bundle.artifact.schemaVersion}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Exported at</dt>
                <dd className="mt-0.5 text-ink-secondary">{formatTimestamp(bundle.exportedAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Produced by</dt>
                <dd className="mt-0.5 text-ink-secondary">
                  {bundle.artifact.producedBy.sdkVersion}
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <dt className="text-ink-muted">Root hash</dt>
                <dd className="mt-0.5 flex items-center gap-2">
                  <Mono className="break-all text-ink-secondary">{bundle.artifact.rootHash}</Mono>
                  <CopyButton value={bundle.artifact.rootHash} label="Copy" />
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Full JSON"
              subtitle={`${(JSON.stringify(bundle).length / 1024).toFixed(1)} KB`}
              action={<CopyButton value={JSON.stringify(bundle, null, 2)} label="Copy JSON" />}
            />
            <div className="p-4">
              <JsonBlock value={bundle} maxHeight="32rem" />
            </div>
          </Card>
        </div>
      )}
    </QueryBoundary>
  );
}
