/**
 * A stat tile — per the data-viz form heuristic, a single headline
 * number is "not a chart," so the Dashboard's system-overview figures
 * render as tiles rather than being forced into a chart shape.
 */
export function StatTile({
  label,
  value,
  hint,
}: {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border-hairline bg-surface-1 px-4 py-3">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
