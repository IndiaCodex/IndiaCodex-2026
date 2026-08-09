"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";
import * as React from "react";

type Item = { id: string; title: string; body: string; at: string; read: boolean; kind: string };

const kindVariant: Record<string, "success" | "cyan" | "warning" | "danger"> = {
  success: "success",
  info: "cyan",
  warning: "warning",
  error: "danger",
};

export function NotificationsPage({ initial, title = "Notifications" }: { initial: Item[]; title?: string }) {
  const [items, setItems] = React.useState(initial);

  return (
    <>
      <PageHeader
        title={title}
        description="Updates from your vault, claims, and the pool."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setItems(items.map((i) => ({ ...i, read: true })))}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />
      <Card className="p-0">
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="All caught up" description="New notifications will land here." />
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn("flex items-start gap-4 px-6 py-4 transition-colors hover:bg-white/[0.03]", !n.read && "bg-cyan/[0.03]")}
              >
                <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-white/15" : "bg-cyan")} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <Badge variant={kindVariant[n.kind] ?? "cyan"}>{n.kind}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{n.body}</p>
                </div>
                <span className="shrink-0 text-xs text-subtle">{timeAgo(n.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
