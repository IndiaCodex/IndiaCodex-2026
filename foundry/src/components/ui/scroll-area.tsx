"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const ScrollArea = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
