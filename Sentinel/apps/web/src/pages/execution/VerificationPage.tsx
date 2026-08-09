import { useReplay } from "../../lib/queries.js";
import { Card, CardHeader } from "../../components/Card.js";
import { StatusBadge } from "../../components/StatusBadge.js";
import { Mono } from "../../components/Mono.js";
import { QueryBoundary } from "../../components/QueryState.js";
import { verificationTone } from "../../components/status-mappings.js";
import { formatTimestamp } from "../../lib/format.js";
import { useExecutionIdParam } from "./useExecutionIdParam.js";

const CHECK_LABELS: Record<string, string> = {
  schemaVersionSupported: "Schema version",
  eventOrdering: "Event ordering",
  identityConsistency: "Identity consistency",
  snapshotConsistency: "Snapshot consistency",
  hashChain: "Hash chain",
  rootHash: "Root hash",
};

export function VerificationPage() {
  const executionId = useExecutionIdParam();
  const { data: session, isLoading, error } = useReplay(executionId, true);
  const report = session?.verification;

  return (
    <QueryBoundary isLoading={isLoading} error={error}>
      {report && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Verification Report"
              subtitle={`Checked ${formatTimestamp(report.checkedAt)}`}
              action={
                <StatusBadge
                  tone={verificationTone(report.valid)}
                  label={report.valid ? "Valid" : "Invalid"}
                />
              }
            />
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              {(Object.entries(report.checks) as Array<[string, boolean]>).map(
                ([check, passed]) => (
                  <div
                    key={check}
                    className="flex items-center justify-between rounded-md border border-border-hairline px-3 py-2"
                  >
                    <span className="text-xs text-ink-secondary">
                      {CHECK_LABELS[check] ?? check}
                    </span>
                    <StatusBadge tone={verificationTone(passed)} label={passed ? "OK" : "Failed"} />
                  </div>
                ),
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Failed Validations" subtitle={`${report.issues.length} issue(s)`} />
            {report.issues.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-muted">
                No integrity issues — every check passed.
              </p>
            ) : (
              <ul>
                {report.issues.map((issue, index) => (
                  <li
                    key={index}
                    className="border-b border-border-hairline px-4 py-3 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Mono className="text-status-critical">{issue.code}</Mono>
                      {issue.sequence !== null && (
                        <span className="text-xs text-ink-muted">sequence {issue.sequence}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-secondary">{issue.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </QueryBoundary>
  );
}
