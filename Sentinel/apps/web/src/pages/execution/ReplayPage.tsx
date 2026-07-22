import { useState } from "react";
import { useReplay, useTriggerReplay } from "../../lib/queries.js";
import { Card, CardHeader } from "../../components/Card.js";
import { StatusBadge } from "../../components/StatusBadge.js";
import { JsonBlock } from "../../components/JsonBlock.js";
import { EventKindBadge } from "../../components/EventKindBadge.js";
import { QueryBoundary } from "../../components/QueryState.js";
import { fidelityTone, verificationTone } from "../../components/status-mappings.js";
import { formatTimestamp } from "../../lib/format.js";
import type { WireReplaySession } from "../../lib/wire-types.js";
import { useExecutionIdParam } from "./useExecutionIdParam.js";

/**
 * Keyed by `session.replaySessionId` at the call site, so a fresh replay
 * (a new session id) remounts this component with `step` reset to 0 —
 * no effect needed to "sync" state to a prop change.
 */
function StepThrough({ session }: { readonly session: WireReplaySession }) {
  const [step, setStep] = useState(0);
  const currentEvent = session.replayedTimeline[step];

  return (
    <Card>
      <CardHeader
        title="Step-by-step"
        subtitle={`Step ${session.replayedTimeline.length === 0 ? 0 : step + 1} of ${session.replayedTimeline.length}`}
      />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-md border border-border-hairline px-2.5 py-1 text-xs font-medium text-ink-secondary hover:border-border-emphasis disabled:opacity-40"
          >
            ← Prev
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0, session.replayedTimeline.length - 1)}
            value={step}
            onChange={(event) => setStep(Number(event.target.value))}
            className="flex-1 accent-accent"
          />
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(session.replayedTimeline.length - 1, s + 1))}
            disabled={step >= session.replayedTimeline.length - 1}
            className="rounded-md border border-border-hairline px-2.5 py-1 text-xs font-medium text-ink-secondary hover:border-border-emphasis disabled:opacity-40"
          >
            Next →
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1">
          {session.replayedTimeline.map((event, index) => (
            <button
              key={event.eventId}
              type="button"
              onClick={() => setStep(index)}
              className={`shrink-0 rounded px-2 py-1 text-xs font-mono-ui ${
                index === step
                  ? "bg-accent text-accent-ink"
                  : "bg-surface-2 text-ink-muted hover:bg-surface-3"
              }`}
            >
              {index}
            </button>
          ))}
        </div>

        {currentEvent && (
          <div className="rounded-md border border-border-hairline bg-surface-2 p-3">
            <div className="mb-2 flex items-center gap-2">
              <EventKindBadge kind={currentEvent.kind} />
              <span className="text-xs text-ink-muted">
                {formatTimestamp(currentEvent.occurredAt)}
              </span>
            </div>
            <JsonBlock value={currentEvent.payload} maxHeight="14rem" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function ReplayPage() {
  const executionId = useExecutionIdParam();
  const replayQuery = useReplay(executionId, true);
  const rerun = useTriggerReplay(executionId);
  const session = replayQuery.data;

  return (
    <QueryBoundary isLoading={replayQuery.isLoading} error={replayQuery.error}>
      {session && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Replay"
              subtitle="Deterministic reconstruction from the Execution Journal — no live LLM, tool, API, or Masumi call is made."
              action={
                <button
                  type="button"
                  onClick={() => rerun.mutate()}
                  disabled={rerun.isPending}
                  className="rounded-md border border-border-hairline px-3 py-1.5 text-xs font-medium text-ink-secondary hover:border-border-emphasis hover:text-ink-primary disabled:opacity-50"
                >
                  {rerun.isPending ? "Replaying…" : "Re-run Replay"}
                </button>
              }
            />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-ink-muted">Fidelity</dt>
                <dd className="mt-0.5">
                  <StatusBadge tone={fidelityTone(session.fidelity)} label={session.fidelity} />
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Verification</dt>
                <dd className="mt-0.5">
                  <StatusBadge
                    tone={verificationTone(session.verification.valid)}
                    label={session.verification.valid ? "Passed" : "Failed"}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Events replayed</dt>
                <dd className="mt-1 text-ink-secondary">{session.replayedTimeline.length}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Replayed at</dt>
                <dd className="mt-1 text-ink-secondary">{formatTimestamp(session.replayedAt)}</dd>
              </div>
            </dl>
          </Card>

          <StepThrough key={session.replaySessionId} session={session} />
        </div>
      )}
    </QueryBoundary>
  );
}
