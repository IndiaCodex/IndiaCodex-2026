import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useExecutions } from "../lib/queries.js";
import { Card } from "../components/Card.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { QueryBoundary } from "../components/QueryState.js";
import { Mono } from "../components/Mono.js";
import { executionStatusLabel, executionStatusTone } from "../components/status-mappings.js";
import { formatTimestamp, truncateId } from "../lib/format.js";
import type { WireExecution } from "../lib/wire-types.js";

type SortKey = "startedAt" | "workflowId" | "status";
type SortDirection = "asc" | "desc";

const STATUS_OPTIONS = ["all", "started", "running", "completed", "failed", "retried"] as const;

function sortExecutions(
  executions: readonly WireExecution[],
  key: SortKey,
  direction: SortDirection,
): WireExecution[] {
  const sorted = [...executions].sort((a, b) => {
    if (key === "startedAt") return a.startedAt.localeCompare(b.startedAt);
    return a[key].localeCompare(b[key]);
  });
  return direction === "asc" ? sorted : sorted.reverse();
}

export function ExecutionsPage() {
  const { data: executions, isLoading, error } = useExecutions({ limit: 200 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("startedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filtered = useMemo(() => {
    if (!executions) return [];
    const term = search.trim().toLowerCase();
    const matches = executions.filter((execution) => {
      const statusMatches = statusFilter === "all" || execution.status === statusFilter;
      const searchMatches =
        term.length === 0 ||
        execution.executionId.toLowerCase().includes(term) ||
        execution.workflowId.toLowerCase().includes(term) ||
        execution.correlationId.toLowerCase().includes(term);
      return statusMatches && searchMatches;
    });
    return sortExecutions(matches, sortKey, sortDirection);
  }, [executions, search, statusFilter, sortKey, sortDirection]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Executions</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Search, filter, and inspect captured executions.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by execution, workflow, or correlation id…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-80 rounded-md border border-border-hairline bg-surface-1 px-3 py-1.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])
          }
          className="rounded-md border border-border-hairline bg-surface-1 px-3 py-1.5 text-sm text-ink-primary focus:border-accent focus:outline-none"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? "All statuses" : executionStatusLabel(status)}
            </option>
          ))}
        </select>
        {executions && (
          <span className="text-xs text-ink-muted">
            {filtered.length} of {executions.length}
          </span>
        )}
      </div>

      <Card>
        <QueryBoundary
          isLoading={isLoading}
          error={error}
          isEmpty={filtered.length === 0}
          emptyMessage="No executions match your search."
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-hairline text-left text-xs text-ink-muted">
                <th className="px-4 py-2 font-medium">Execution</th>
                <SortableHeader
                  label="Workflow"
                  sortKey="workflowId"
                  active={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  active={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <SortableHeader
                  label="Started"
                  sortKey="startedAt"
                  active={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <th className="px-4 py-2 font-medium">Correlation</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((execution) => (
                <tr
                  key={execution.executionId}
                  className="border-b border-border-hairline last:border-0 hover:bg-surface-2"
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
                    {formatTimestamp(execution.startedAt)}
                  </td>
                  <td className="px-4 py-2 text-ink-muted">
                    <Mono>{truncateId(execution.correlationId, 10)}</Mono>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </QueryBoundary>
      </Card>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  active,
  direction,
  onSort,
}: {
  readonly label: string;
  readonly sortKey: SortKey;
  readonly active: SortKey;
  readonly direction: SortDirection;
  readonly onSort: (key: SortKey) => void;
}) {
  const isActive = active === sortKey;
  return (
    <th className="px-4 py-2 font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 ${isActive ? "text-ink-primary" : "text-ink-muted hover:text-ink-secondary"}`}
      >
        {label}
        {isActive && <span aria-hidden="true">{direction === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}
