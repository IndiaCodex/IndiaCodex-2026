import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
  {
    variants: {
      variant: {
        default: "bg-white/5 text-muted border-white/10",
        cyan: "bg-cyan/10 text-cyan border-cyan/25",
        violet: "bg-violet/10 text-violet border-violet/25",
        success: "bg-emerald/10 text-emerald border-emerald/25",
        warning: "bg-amber/10 text-amber border-amber/25",
        danger: "bg-danger/10 text-danger border-danger/25",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft" />}
      {children}
    </span>
  );
}
