import { Card, CardHeader } from "./Card.js";
import type { StatusTone } from "./StatusBadge.js";
import { executionStatusLabel, executionStatusTone } from "./status-mappings.js";
import type { WireExecution } from "../lib/wire-types.js";

const TONE_FILL_CLASSES: Record<StatusTone, string> = {
  good: "bg-status-good",
  warning: "bg-status-warning",
  serious: "bg-status-serious",
  critical: "bg-status-critical",
  neutral: "bg-ink-muted",
  info: "bg-accent",
};

/**
 * A single stacked bar over the real, currently-fetched execution set —
 * no separate query, no synthetic counts. Segment order is stable
 * (status-tone-derived, not insertion order) so the bar doesn't reshuffle
 * as executions complete.
 */
export function StatusDistribution({
  executions,
}: {
  readonly executions: readonly WireExecution[];
}) {
  const counts = new Map<string, number>();
  for (const execution of executions) {
    counts.set(execution.status, (counts.get(execution.status) ?? 0) + 1);
  }
  const total = executions.length;
  const segments = [...counts.entries()]
    .map(([status, count]) => ({
      status,
      count,
      tone: executionStatusTone(status),
      label: executionStatusLabel(status),
      pct: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader
        title="Execution Status Distribution"
        subtitle={`${total} captured execution${total === 1 ? "" : "s"}`}
      />
      <div className="px-4 py-4">
        {total === 0 ? (
          <p className="py-4 text-center text-sm text-ink-muted">No executions captured yet.</p>
        ) : (
          <>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-3">
              {segments.map((segment) => (
                <div
                  key={segment.status}
                  className={`h-full border-r-2 border-surface-1 last:border-r-0 ${TONE_FILL_CLASSES[segment.tone]}`}
                  style={{ width: `${segment.pct}%` }}
                  title={`${segment.label}: ${segment.count} (${segment.pct.toFixed(0)}%)`}
                />
              ))}
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {segments.map((segment) => (
                <li key={segment.status} className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${TONE_FILL_CLASSES[segment.tone]}`}
                    aria-hidden="true"
                  />
                  <span className="text-ink-secondary">{segment.label}</span>
                  <span className="font-mono-ui text-xs text-ink-muted">{segment.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}
