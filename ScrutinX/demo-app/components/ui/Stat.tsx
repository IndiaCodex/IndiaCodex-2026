export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "success" | "danger" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "danger"
      ? "text-danger"
      : tone === "accent"
      ? "text-accent"
      : "text-text";
  return (
    <div className="rounded-lg bg-surface2 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`nums mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}
