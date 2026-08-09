"use client";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors duration-200 cursor-pointer disabled:opacity-40",
        checked ? "bg-gradient-to-r from-cyan to-violet" : "bg-white/10"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}
