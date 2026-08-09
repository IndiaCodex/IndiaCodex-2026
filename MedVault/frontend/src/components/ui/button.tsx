import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-cyan to-violet text-black font-semibold hover:opacity-90 hover:shadow-[0_0_24px_-4px_rgba(34,211,238,0.5)]",
        secondary:
          "glass text-white hover:bg-white/10",
        ghost: "text-muted hover:text-white hover:bg-white/5",
        outline:
          "border border-white/15 text-white hover:bg-white/5 hover:border-white/25",
        danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
        success: "bg-emerald/15 text-emerald border border-emerald/30 hover:bg-emerald/25",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
