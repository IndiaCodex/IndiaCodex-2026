import { useState } from "react";
import { useExecution, useExecutionArtifact } from "../../lib/queries.js";
import { ApiError } from "../../lib/api-client.js";
import { Card, CardHeader } from "../../components/Card.js";
import { EventKindBadge } from "../../components/EventKindBadge.js";
import { JsonBlock } from "../../components/JsonBlock.js";
import { QueryBoundary } from "../../components/QueryState.js";
import { formatTimestamp } from "../../lib/format.js";
import type { WireEvent, WireSnapshot } from "../../lib/wire-types.js";
import { useExecutionIdParam } from "./useExecutionIdParam.js";

function eventSummary(event: WireEvent): string {
  switch (event.kind) {
    case "lifecycle":
      return event.payload.transition;
    case "tool":
      return `${event.payload.toolName} (${event.payload.phase})`;
    case "decision":
      return event.payload.summary;
    case "payment":
      return `${event.payload.paymentId} (${event.payload.phase})`;
  }
}

function EventRow({
  event,
  snapshot,
}: {
  readonly event: WireEvent;
  readonly snapshot: WireSnapshot | undefined;
}) {
  const [open, setOpen] = useState(false);
  const hasMetadata = Object.keys(event.metadata).length > 0;

  return (
    <li className="border-b border-border-hairline last:border-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2"
      >
        <span className="w-6 shrink-0 text-right font-mono-ui text-xs text-ink-muted">
          {event.sequence}
        </span>
        <EventKindBadge kind={event.kind} />
        <span className="min-w-0 flex-1 truncate text-sm text-ink-primary">
          {eventSummary(event)}
        </span>
        {event.snapshotRef && (
          <span className="shrink-0 rounded bg-surface-3 px-1.5 py-0.5 text-[11px] text-ink-muted">
            snapshot
          </span>
        )}
        <span className="shrink-0 text-xs text-ink-muted">{formatTimestamp(event.occurredAt)}</span>
        <span className="shrink-0 text-ink-muted" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <div>
            <p className="mb-1 text-xs font-medium text-ink-muted">Payload</p>
            <JsonBlock value={event.payload} maxHeight="12rem" />
          </div>
          {snapshot && (
            <div>
              <p className="mb-1 text-xs font-medium text-ink-muted">
                Snapshot ({snapshot.kind}) — captured {formatTimestamp(snapshot.capturedAt)}
              </p>
              <JsonBlock
                value={{ request: snapshot.request, response: snapshot.response }}
                maxHeight="16rem"
              />
            </div>
          )}
          {event.snapshotRef && !snapshot && (
            <p className="text-xs text-ink-muted">
              Snapshot not yet available — the execution isn&apos;t sealed. Snapshots are exposed
              once the Journal is sealed into an Execution Artifact.
            </p>
          )}
          {hasMetadata && (
            <div>
              <p className="mb-1 text-xs font-medium text-ink-muted">Metadata</p>
              <JsonBlock value={event.metadata} maxHeight="8rem" />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function TimelinePage() {
  const executionId = useExecutionIdParam();
  const { data: execution, isLoading, error } = useExecution(executionId);
  const artifactQuery = useExecutionArtifact(executionId);

  const artifactNotSealed =
    artifactQuery.error instanceof ApiError && artifactQuery.error.status === 404;
  const snapshotsById = new Map(
    (artifactQuery.data?.snapshots ?? []).map((s) => [s.snapshotId, s]),
  );

  return (
    <QueryBoundary
      isLoading={isLoading}
      error={error}
      isEmpty={execution?.timeline.length === 0}
      emptyMessage="No events captured."
    >
      <Card>
        <CardHeader
          title="Timeline"
          subtitle={
            artifactNotSealed
              ? `${execution?.timeline.length ?? 0} events — not yet sealed, snapshots unavailable`
              : `${execution?.timeline.length ?? 0} events`
          }
        />
        <ul>
          {execution?.timeline.map((event) => (
            <EventRow
              key={event.eventId}
              event={event}
              snapshot={event.snapshotRef ? snapshotsById.get(event.snapshotRef) : undefined}
            />
          ))}
        </ul>
      </Card>
    </QueryBoundary>
  );
}
