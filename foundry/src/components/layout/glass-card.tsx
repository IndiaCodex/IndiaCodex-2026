"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(
        "rounded-2xl border border-border bg-card transition-all duration-300",
        hover && "hover:border-border-hover hover:bg-card-hover",
        className,
      )} {...props}>
        {children}
      </div>
    );
  },
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
