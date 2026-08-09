import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-14 text-center", className)}>
      <div className="mb-4 rounded-2xl bg-white/5 p-4">
        <Icon className="h-7 w-7 text-subtle" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-subtle">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
