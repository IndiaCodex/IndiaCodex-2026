import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { Check, Circle, Loader2 } from "lucide-react";

export type TimelineStep = {
  label: string;
  description?: string;
  at?: string;
  status: "done" | "active" | "pending";
};

export function ClaimTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative space-y-6">
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex gap-4">
          {i < steps.length - 1 && (
            <span
              className={cn(
                "absolute left-[13px] top-8 h-[calc(100%-8px)] w-px",
                step.status === "done" ? "bg-emerald/50" : "bg-white/10"
              )}
            />
          )}
          <span
            className={cn(
              "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
              step.status === "done" && "border-emerald/50 bg-emerald/15 text-emerald",
              step.status === "active" && "border-cyan/50 bg-cyan/15 text-cyan",
              step.status === "pending" && "border-white/10 bg-white/5 text-subtle"
            )}
          >
            {step.status === "done" ? (
              <Check className="h-3.5 w-3.5" />
            ) : step.status === "active" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Circle className="h-2.5 w-2.5" />
            )}
          </span>
          <div className="pb-1">
            <p className={cn("text-sm font-medium", step.status === "pending" && "text-subtle")}>
              {step.label}
            </p>
            {step.description && <p className="mt-0.5 text-xs text-muted">{step.description}</p>}
            {step.at && <p className="mt-0.5 text-xs text-subtle">{formatDateTime(step.at)}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
