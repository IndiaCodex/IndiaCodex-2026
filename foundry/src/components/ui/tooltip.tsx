"use client";

import { useState, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 max-w-[16rem] rounded-lg border border-border bg-card px-3 py-2 text-xs leading-relaxed text-foreground shadow-[var(--shadow-card)]",
            side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
            side === "bottom" && "top-full left-1/2 mt-2 -translate-x-1/2",
            side === "left" && "right-full top-1/2 mr-2 -translate-y-1/2",
            side === "right" && "left-full top-1/2 ml-2 -translate-y-1/2",
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}