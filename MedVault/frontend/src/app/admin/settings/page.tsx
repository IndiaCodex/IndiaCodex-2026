"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SettingsCard, ToggleRow } from "@/components/shared/settings-blocks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function AdminSettings() {
  const { toast } = useToast();
  return (
    <>
      <PageHeader title="System settings" description="Platform-wide risk and treasury parameters." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold">Treasury parameters</h3>
          <div className="space-y-4">
            <div><Label>Max allocation (% of pool)</Label><Input type="number" defaultValue={80} /></div>
            <div><Label>Minimum liquidity floor (%)</Label><Input type="number" defaultValue={20} /></div>
            <div><Label>Auto-approve claims below (₳)</Label><Input type="number" defaultValue={500} /></div>
            <div><Label>Collateral liquidation floor (%)</Label><Input type="number" defaultValue={140} /></div>
            <Button size="sm" onClick={() => toast("success", "Parameters saved", "Changes take effect next epoch.")}>Save parameters</Button>
          </div>
        </Card>
        <SettingsCard title="Platform controls">
          <ToggleRow label="New enrollments" description="Accept new policy purchases" defaultOn />
          <ToggleRow label="Claim submissions" description="Accept new claims" defaultOn />
          <ToggleRow label="Yield deployment" description="Allow new treasury allocations" defaultOn />
          <ToggleRow label="Fraud engine strict mode" description="Lower alert thresholds" />
          <ToggleRow label="Maintenance banner" description="Show downtime notice to users" />
        </SettingsCard>
      </div>
    </>
  );
}
