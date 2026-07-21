import { cn } from "@/lib/utils";

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/8", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-cyan to-violet transition-all duration-700",
          barClassName
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
