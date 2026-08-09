import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === "default",
          "border-transparent bg-sidebar-border text-text-primary hover:bg-sidebar-border/80": variant === "secondary",
          "text-foreground border-card-border": variant === "outline",
          "border-transparent bg-success/10 text-success": variant === "success",
          "border-transparent bg-warning/10 text-warning": variant === "warning",
          "border-transparent bg-error/10 text-error": variant === "error",
          "border-transparent bg-info/10 text-info": variant === "info",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
