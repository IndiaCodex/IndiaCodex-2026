"use client";

import { PageHeader } from "@/components/shared/page-header";
import { InfoRow, SettingsCard, ToggleRow } from "@/components/shared/settings-blocks";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import { auditLogs } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { Laptop, ShieldCheck, Smartphone } from "lucide-react";

export default function AdminProfile() {
  const { session } = useAuth();
  return (
    <>
      <PageHeader title="Administrator profile" description="Your role, security posture, and action history." />
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Audit history</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-6 lg:grid-cols-2">
            <SettingsCard title="Administrator information">
              <InfoRow label="Name" value={session?.name ?? "Platform Admin"} />
              <InfoRow label="Email" value={session?.email ?? "admin@medvault.io"} />
              <InfoRow label="Role" value={<Badge variant="danger">Super admin</Badge>} />
              <InfoRow label="MFA" value={<span className="flex items-center gap-1.5 text-emerald text-sm"><ShieldCheck className="h-4 w-4" /> Enforced</span>} />
            </SettingsCard>
            <SettingsCard title="Permissions">
              <InfoRow label="Treasury allocation" value={<Badge variant="success">granted</Badge>} />
              <InfoRow label="Claim approvals" value={<Badge variant="success">granted</Badge>} />
              <InfoRow label="User management" value={<Badge variant="success">granted</Badge>} />
              <InfoRow label="Parameter changes" value={<Badge variant="warning">requires co-sign</Badge>} />
            </SettingsCard>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <SettingsCard title="Security settings">
            <ToggleRow label="Hardware key MFA" description="FIDO2 security key required" defaultOn />
            <ToggleRow label="Session timeout" description="Auto sign-out after 15 minutes idle" defaultOn />
            <ToggleRow label="IP allowlist" description="Restrict console to approved networks" defaultOn />
            <ToggleRow label="Action co-signing" description="Second admin approves treasury changes" defaultOn />
          </SettingsCard>
        </TabsContent>

        <TabsContent value="activity">
          <SettingsCard title="Your recent actions">
            {auditLogs.filter((l) => l.actor === "admin@medvault.io").map((l) => (
              <InfoRow key={l.id} label={l.action} value={formatDateTime(l.at)} />
            ))}
          </SettingsCard>
        </TabsContent>

        <TabsContent value="devices">
          <SettingsCard title="Connected devices">
            <InfoRow label="Windows · Chrome" value={<span className="flex items-center gap-2 text-sm"><Laptop className="h-4 w-4 text-cyan" /> This device</span>} />
            <InfoRow label="iOS · App" value={<span className="flex items-center gap-2 text-sm text-muted"><Smartphone className="h-4 w-4" /> 5d ago</span>} />
          </SettingsCard>
        </TabsContent>
      </Tabs>
    </>
  );
}
