const KIND_LABEL: Record<string, string> = {
  lifecycle: "Lifecycle",
  tool: "Tool",
  decision: "Decision",
  payment: "Payment",
};

const KIND_TONE_CLASSES: Record<string, string> = {
  lifecycle: "bg-surface-3 text-ink-secondary",
  tool: "bg-accent/15 text-accent",
  decision: "bg-status-warning/15 text-status-warning",
  payment: "bg-status-good/15 text-status-good",
};

export function EventKindBadge({ kind }: { readonly kind: string }) {
  const classes = KIND_TONE_CLASSES[kind] ?? "bg-surface-3 text-ink-secondary";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${classes}`}
    >
      {KIND_LABEL[kind] ?? kind}
    </span>
  );
}
