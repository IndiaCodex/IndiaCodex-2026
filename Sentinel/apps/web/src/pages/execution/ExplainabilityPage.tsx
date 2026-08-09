import { useExplainability } from "../../lib/queries.js";
import { Card, CardHeader } from "../../components/Card.js";
import { StatusBadge } from "../../components/StatusBadge.js";
import { QueryBoundary } from "../../components/QueryState.js";
import { StatTile } from "../../components/StatTile.js";
import { toolOutcomeTone, paymentStateTone } from "../../components/status-mappings.js";
import { formatDuration } from "../../lib/format.js";
import { useExecutionIdParam } from "./useExecutionIdParam.js";

export function ExplainabilityPage() {
  const executionId = useExecutionIdParam();
  const { data: report, isLoading, error } = useExplainability(executionId);

  return (
    <QueryBoundary isLoading={isLoading} error={error}>
      {report && (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-border-hairline bg-surface-2 px-3 py-2 text-xs text-ink-muted">
            Engineering Mode — every field below is a deterministic function of recorded data. No
            AI, no natural-language generation, no probabilistic reasoning (ADR-0002).
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Outcome" value={report.executionSummary.outcome} />
            <StatTile label="Duration" value={formatDuration(report.executionSummary.durationMs)} />
            <StatTile
              label="Tool Invocations"
              value={String(report.executionSummary.toolInvocationCount)}
            />
            <StatTile label="Decisions" value={String(report.executionSummary.decisionCount)} />
          </div>

          {report.failure.failed && (
            <Card>
              <CardHeader
                title="Failure Analysis"
                action={<StatusBadge tone="critical" label="Failed" />}
              />
              <div className="px-4 py-3 text-sm">
                <p className="text-ink-secondary">
                  Failed at sequence{" "}
                  <span className="font-mono-ui">{report.failure.failedAtSequence}</span>
                </p>
                {report.failure.reason && (
                  <p className="mt-1 text-ink-primary">{report.failure.reason}</p>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Timeline Summary"
              subtitle={`${report.timelineSummary.length} events`}
            />
            <ol>
              {report.timelineSummary.map((explanation) => (
                <li
                  key={explanation.subjectEventSequence}
                  className="flex gap-3 border-b border-border-hairline px-4 py-2.5 text-sm last:border-0"
                >
                  <span className="w-6 shrink-0 text-right font-mono-ui text-xs text-ink-muted">
                    {explanation.subjectEventSequence}
                  </span>
                  <span className="text-ink-secondary">{explanation.text}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHeader
              title="Tool Flow"
              subtitle={`${report.toolExecutionSequence.length} invocation(s)`}
            />
            {report.toolExecutionSequence.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-muted">No tool invocations.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-hairline text-left text-xs text-ink-muted">
                    <th className="px-4 py-2 font-medium">Tool</th>
                    <th className="px-4 py-2 font-medium">Outcome</th>
                    <th className="px-4 py-2 font-medium">Duration</th>
                    <th className="px-4 py-2 font-medium">Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {report.toolExecutionSequence.map((step, index) => (
                    <tr key={index} className="border-b border-border-hairline last:border-0">
                      <td className="px-4 py-2 text-ink-primary">{step.toolName}</td>
                      <td className="px-4 py-2">
                        <StatusBadge tone={toolOutcomeTone(step.outcome)} label={step.outcome} />
                      </td>
                      <td className="px-4 py-2 text-ink-muted">
                        {formatDuration(step.durationMs)}
                      </td>
                      <td className="px-4 py-2 font-mono-ui text-xs text-ink-muted">
                        {step.invokedAtSequence} → {step.completedAtSequence ?? "…"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Payment Flow"
              subtitle={`${report.paymentLifecycle.length} payment(s)`}
            />
            {report.paymentLifecycle.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-muted">No payments.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-hairline text-left text-xs text-ink-muted">
                    <th className="px-4 py-2 font-medium">Payment</th>
                    <th className="px-4 py-2 font-medium">State</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Masumi Reference</th>
                    <th className="px-4 py-2 font-medium">Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {report.paymentLifecycle.map((step) => (
                    <tr
                      key={step.paymentId}
                      className="border-b border-border-hairline last:border-0"
                    >
                      <td className="px-4 py-2 font-mono-ui text-xs text-ink-primary">
                        {step.paymentId}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge tone={paymentStateTone(step.state)} label={step.state} />
                      </td>
                      <td className="px-4 py-2 text-ink-secondary">
                        {step.amount} {step.currency}
                      </td>
                      <td className="px-4 py-2 font-mono-ui text-xs">
                        {step.masumiReference ? (
                          <span className="text-accent" title="Enriched via MasumiAdapterPort">
                            {step.masumiReference}
                          </span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono-ui text-xs text-ink-muted">
                        {step.requestedAtSequence ?? "…"} → {step.completedAtSequence ?? "…"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </QueryBoundary>
  );
}
