export type StatusTone = "good" | "warning" | "serious" | "critical" | "neutral" | "info";

const TONE_CLASSES: Record<StatusTone, string> = {
  good: "bg-status-good/15 text-status-good border-status-good/30",
  warning: "bg-status-warning/15 text-status-warning border-status-warning/30",
  serious: "bg-status-serious/15 text-status-serious border-status-serious/30",
  critical: "bg-status-critical/15 text-status-critical border-status-critical/30",
  neutral: "bg-surface-3 text-ink-secondary border-border-emphasis",
  info: "bg-accent/15 text-accent border-accent/30",
};

const TONE_DOT: Record<StatusTone, string> = {
  good: "bg-status-good",
  warning: "bg-status-warning",
  serious: "bg-status-serious",
  critical: "bg-status-critical",
  neutral: "bg-ink-muted",
  info: "bg-accent",
};

export interface StatusBadgeProps {
  readonly tone: StatusTone;
  readonly label: string;
}

/** Status is never color-alone: a dot + text label always ships together. */
export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} aria-hidden="true" />
      {label}
    </span>
  );
}
