"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center rounded-full border border-border bg-surface-hover overflow-hidden",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt || ""} className="h-full w-full object-cover" />
        ) : (
          <span className="font-medium text-foreground-muted">
            {fallback || "?"}
          </span>
        )}
      </div>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
