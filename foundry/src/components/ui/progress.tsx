"use client";

import { cn } from "@/lib/utils";

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  showLabel,
  size = "md",
}: ProgressProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const heights = { sm: "h-1", md: "h-2", lg: "h-3" };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-foreground-muted">
          <span>{percentage}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-surface-hover",
          heights[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-500 ease-out",
            indicatorClassName,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
