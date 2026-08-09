"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import * as React from "react";

export function ToggleRow({
  label,
  description,
  defaultOn = false,
}: {
  label: string;
  description?: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = React.useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-0.5 text-xs text-subtle">{description}</p>}
      </div>
      <Switch checked={on} onChange={setOn} />
    </div>
  );
}

export function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <div className="divide-y divide-white/5">{children}</div>
    </Card>
  );
}

export function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-subtle">{label}</span>
      <span className={mono ? "font-mono text-xs" : "text-sm font-medium"}>{value}</span>
    </div>
  );
}
