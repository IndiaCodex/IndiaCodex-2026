export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "danger" | "warn" | "accent";
}) {
  const toneClass = {
    default: "bg-surface2 text-muted",
    success: "bg-success/15 text-success",
    danger: "bg-danger/15 text-danger",
    warn: "bg-warn/15 text-warn",
    accent: "bg-accent/15 text-accent",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClass}`}
    >
      {children}
    </span>
  );
}
