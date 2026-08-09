import { NavLink, Outlet, useParams } from "react-router";
import { useExecution } from "../../lib/queries.js";
import { QueryBoundary } from "../../components/QueryState.js";
import { StatusBadge } from "../../components/StatusBadge.js";
import { Mono } from "../../components/Mono.js";
import { CopyButton } from "../../components/CopyButton.js";
import { executionStatusLabel, executionStatusTone } from "../../components/status-mappings.js";
import { formatTimestamp } from "../../lib/format.js";

const TABS = [
  { to: "", label: "Timeline", end: true },
  { to: "replay", label: "Replay", end: false },
  { to: "verification", label: "Verification", end: false },
  { to: "explain", label: "Explainability", end: false },
  { to: "artifact", label: "Artifact", end: false },
];

export function ExecutionLayout() {
  const { executionId } = useParams<{ executionId: string }>();
  const { data: execution, isLoading, error } = useExecution(executionId);

  return (
    <div className="flex flex-col gap-4">
      <QueryBoundary isLoading={isLoading} error={error}>
        {execution && (
          <div className="rounded-lg border border-border-hairline bg-surface-1 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge
                tone={executionStatusTone(execution.status)}
                label={executionStatusLabel(execution.status)}
              />
              <Mono className="text-ink-primary">{execution.executionId}</Mono>
              <CopyButton value={execution.executionId} label="Copy ID" />
              <span className="text-sm text-ink-secondary">{execution.workflowId}</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-ink-muted">Started</dt>
                <dd className="text-ink-secondary">{formatTimestamp(execution.startedAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Ended</dt>
                <dd className="text-ink-secondary">
                  {execution.endedAt ? formatTimestamp(execution.endedAt) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Correlation ID</dt>
                <dd>
                  <Mono className="text-ink-secondary">{execution.correlationId}</Mono>
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Trace ID</dt>
                <dd>
                  <Mono className="text-ink-secondary">{execution.traceId}</Mono>
                </dd>
              </div>
            </dl>
          </div>
        )}

        <nav className="mt-4 flex gap-1 border-b border-border-hairline">
          {TABS.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `border-b-2 px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "border-accent text-ink-primary"
                    : "border-transparent text-ink-muted hover:text-ink-secondary"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-4">
          <Outlet />
        </div>
      </QueryBoundary>
    </div>
  );
}
