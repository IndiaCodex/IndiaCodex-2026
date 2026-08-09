"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      default: "btn--primary",
      destructive: "btn--destructive",
      outline: "btn--outline",
      secondary: "btn--secondary",
      ghost: "btn--ghost",
      link: "btn--link",
    },
    size: {
      default: "btn--md",
      sm: "btn--sm",
      lg: "btn--lg",
      xl: "btn--xl",
      icon: "btn--icon",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          loading && "btn--loading",
          className,
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <span className="btn__spinner" aria-hidden /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };