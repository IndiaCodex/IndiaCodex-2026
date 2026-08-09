"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/format";
import { fraudAlerts } from "@/lib/mock-data";
import { Activity, ShieldAlert, ShieldCheck, Siren } from "lucide-react";
import * as React from "react";

export default function AdminFraud() {
  const { toast } = useToast();
  const [alerts, setAlerts] = React.useState(fraudAlerts);

  return (
    <>
      <PageHeader
        title="Fraud monitoring"
        description="Anomaly detection over commitments and claim flows — privacy-preserving by design."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Open alerts" value={String(alerts.length)} icon={Siren} accent="amber" />
        <StatCard index={1} label="False-positive rate" value="2.1%" trend={-0.4} icon={Activity} accent="cyan" />
        <StatCard index={2} label="Blocked this quarter" value="₳48.2k" sub="11 fraudulent claims" icon={ShieldCheck} accent="emerald" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Active alerts</CardTitle>
          <ShieldAlert className="h-4 w-4 text-danger" />
        </CardHeader>
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-subtle">No active alerts. The risk engine keeps watching.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Badge variant={a.severity === "high" ? "danger" : a.severity === "medium" ? "warning" : "default"} dot>
                      {a.severity}
                    </Badge>
                    <p className="text-sm font-medium">{a.title}</p>
                  </div>
                  <span className="text-xs text-subtle">{timeAgo(a.at)}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{a.detail}</p>
                <p className="mt-1 font-mono text-xs text-subtle">entity: {a.entity}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="danger" onClick={() => { setAlerts(alerts.filter((x) => x.id !== a.id)); toast("warning", "Escalated", "Case opened for investigation."); }}>
                    Escalate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAlerts(alerts.filter((x) => x.id !== a.id)); toast("success", "Dismissed", "Marked as false positive."); }}>
                    Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
