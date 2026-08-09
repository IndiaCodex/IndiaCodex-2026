"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "segmented";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "icon" ? "h-9 w-9" : "h-9 w-[4.5rem] rounded-lg",
          "rounded-lg border border-border bg-surface",
          className,
        )}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  if (variant === "segmented") {
    return (
      <div className={cn("btn-segment-group", className)} role="group" aria-label="Theme">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={cn("btn-segment", !isDark && "btn-segment--active")}
          aria-pressed={!isDark}
          aria-label="Light mode"
        >
          <Sun className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={cn("btn-segment", isDark && "btn-segment--active")}
          aria-pressed={isDark}
          aria-label="Dark mode"
        >
          <Moon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-9 w-9 text-foreground-muted hover:text-foreground", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}