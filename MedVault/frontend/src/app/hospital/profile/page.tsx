"use client";

import { PageHeader } from "@/components/shared/page-header";
import { InfoRow, SettingsCard, ToggleRow } from "@/components/shared/settings-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { mockHospital } from "@/lib/mock-data";
import { shortAddress } from "@/lib/format";

const staff = [
  { name: "Dr. R. Iyer", role: "Claims administrator", status: "active" },
  { name: "S. Kapoor", role: "Billing lead", status: "active" },
  { name: "Dr. M. Chen", role: "Attending physician", status: "invited" },
];

export default function HospitalProfile() {
  const { toast } = useToast();
  const h = mockHospital;
  return (
    <>
      <PageHeader title="Hospital profile" description="Institution details, staff, payments, and security." />
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="stats">Claims stats</TabsTrigger>
          <TabsTrigger value="security">Security & alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold">Hospital information</h3>
              <div className="space-y-4">
                <div><Label>Name</Label><Input defaultValue={h.name} /></div>
                <div><Label>Address</Label><Input defaultValue={h.address} /></div>
                <Button size="sm" onClick={() => toast("success", "Profile updated")}>Save</Button>
              </div>
            </Card>
            <SettingsCard title="License & verification">
              <InfoRow label="License" value={h.license} mono />
              <InfoRow label="Status" value={<Badge variant="success" dot>Verified</Badge>} />
              <InfoRow label="Verified on" value="Jul 2, 2026" />
              <InfoRow label="Network tier" value="Preferred provider" />
            </SettingsCard>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <SettingsCard title="Staff management">
            {staff.map((s) => (
              <InfoRow
                key={s.name}
                label={`${s.name} — ${s.role}`}
                value={<Badge variant={s.status === "active" ? "success" : "warning"}>{s.status}</Badge>}
              />
            ))}
          </SettingsCard>
          <Button className="mt-4" variant="secondary" size="sm" onClick={() => toast("info", "Invite sent")}>Invite staff member</Button>
        </TabsContent>

        <TabsContent value="payments">
          <SettingsCard title="Payment information">
            <InfoRow label="Payout address" value={shortAddress(h.wallet)} mono />
            <InfoRow label="Network" value="Cardano preprod" />
            <InfoRow label="Settlement" value="Instant on approval" />
            <InfoRow label="Payout token" value="ADA" />
          </SettingsCard>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              ["Claims processed", "412"],
              ["Approval rate", `${h.approvalRate}%`],
              ["Avg. settlement", "26h"],
            ].map(([k, v]) => (
              <Card key={k}>
                <p className="text-xs uppercase tracking-wider text-subtle">{k}</p>
                <p className="mt-2 text-2xl font-semibold">{v}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <SettingsCard title="Security & notifications">
            <ToggleRow label="Multi-factor authentication" description="Required for all staff" defaultOn />
            <ToggleRow label="Claim status alerts" description="Email on approval or payout" defaultOn />
            <ToggleRow label="Large payout confirmation" description="Manual confirm above ₳5,000" defaultOn />
            <ToggleRow label="Weekly earnings digest" />
          </SettingsCard>
        </TabsContent>
      </Tabs>
    </>
  );
}
