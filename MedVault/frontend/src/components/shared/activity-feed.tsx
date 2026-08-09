import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type ActivityItem = {
  id: string;
  type: "deposit" | "payout" | "claim" | "policy" | "yield";
  title: string;
  detail: string;
  at: string;
};

const config: Record<ActivityItem["type"], { icon: LucideIcon; cls: string }> = {
  deposit: { icon: ArrowDownLeft, cls: "text-cyan bg-cyan/10" },
  payout: { icon: ArrowUpRight, cls: "text-violet bg-violet/10" },
  claim: { icon: FileText, cls: "text-amber bg-amber/10" },
  policy: { icon: ShieldCheck, cls: "text-emerald bg-emerald/10" },
  yield: { icon: Sparkles, cls: "text-emerald bg-emerald/10" },
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const { icon: Icon, cls } = config[item.type];
        return (
          <li
            key={item.id}
            className="flex items-center gap-3.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.04]"
          >
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", cls)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="truncate text-xs text-subtle">{item.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-subtle">{timeAgo(item.at)}</span>
          </li>
        );
      })}
    </ul>
  );
}
