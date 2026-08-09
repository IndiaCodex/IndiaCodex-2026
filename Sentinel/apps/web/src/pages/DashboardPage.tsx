import { Link } from "react-router";
import { useExecutions, useIntegritySummary } from "../lib/queries.js";
import { StatTile } from "../components/StatTile.js";
import { Card, CardHeader } from "../components/Card.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { StatusDistribution } from "../components/StatusDistribution.js";
import { QueryBoundary } from "../components/QueryState.js";
import { Mono } from "../components/Mono.js";
import { executionStatusLabel, executionStatusTone } from "../components/status-mappings.js";
import { formatRelativeTime, truncateId } from "../lib/format.js";
import type { WireExecution } from "../lib/wire-types.js";

const TERMINAL_STATUSES = new Set(["completed", "failed"]);

function IntegritySummary({ executions }: { readonly executions: readonly WireExecution[] }) {
  const terminalIds = executions
    .filter((e) => TERMINAL_STATUSES.has(e.status))
    .map((e) => e.executionId);
  const results = useIntegritySummary(terminalIds);

  const loaded = results.filter((r) => r.isSuccess);
  const verified = loaded.filter(
    (r) => r.data?.verification.valid && r.data.fidelity === "identical",
  );
  const stillChecking = results.some((r) => r.isLoading);

  return (
    <StatTile
      label="Integrity Summary"
      value={stillChecking ? "…" : `${verified.length}/${loaded.length}`}
      hint={stillChecking ? "Replaying sealed executions…" : "sealed executions pass verification"}
    />
  );
}

export function DashboardPage() {
  const { data: executions, isLoading, error } = useExecutions({ limit: 20 });

  const counts = {
    total: executions?.length ?? 0,
    completed: executions?.filter((e) => e.status === "completed").length ?? 0,
    failed: executions?.filter((e) => e.status === "failed").length ?? 0,
    running:
      executions?.filter((e) => e.status === "started" || e.status === "running").length ?? 0,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">System overview across captured executions.</p>
      </div>

      <QueryBoundary isLoading={isLoading} error={error}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Total Executions" value={String(counts.total)} />
          <StatTile label="Completed" value={String(counts.completed)} />
          <StatTile label="Failed" value={String(counts.failed)} />
          <StatTile label="In Progress" value={String(counts.running)} />
          {executions && <IntegritySummary executions={executions} />}
        </div>

        {executions && (
          <div className="mt-6">
            <StatusDistribution executions={executions} />
          </div>
        )}

        <Card className="mt-6">
          <CardHeader
            title="Recent Executions"
            subtitle="Most recently started, across all workflows"
          />
          {executions && executions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              No executions captured yet. Run <Mono>pnpm seed:demo</Mono> to seed the canonical demo
              workflow.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-hairline text-left text-xs text-ink-muted">
                  <th className="px-4 py-2 font-medium">Execution</th>
                  <th className="px-4 py-2 font-medium">Workflow</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {executions?.map((execution) => (
                  <tr
                    key={execution.executionId}
                    className="border-b border-border-hairline last:border-0"
                  >
                    <td className="px-4 py-2">
                      <Link
                        to={`/executions/${execution.executionId}`}
                        className="text-accent hover:underline"
                      >
                        <Mono>{truncateId(execution.executionId, 13)}</Mono>
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-ink-secondary">{execution.workflowId}</td>
                    <td className="px-4 py-2">
                      <StatusBadge
                        tone={executionStatusTone(execution.status)}
                        label={executionStatusLabel(execution.status)}
                      />
                    </td>
                    <td className="px-4 py-2 text-ink-muted">
                      {formatRelativeTime(execution.startedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </QueryBoundary>
    </div>
  );
}
