import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border-hairline bg-surface-1 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-hairline px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
