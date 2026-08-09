"use client";

import { PageHeader } from "@/components/shared/page-header";
import { InfoRow, SettingsCard, ToggleRow } from "@/components/shared/settings-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";
import { formatDate, shortAddress } from "@/lib/format";
import { mockPolicy, mockUser } from "@/lib/mock-data";
import { Laptop, Smartphone } from "lucide-react";

export default function UserProfile() {
  const { session } = useAuth();
  const { toast } = useToast();

  return (
    <>
      <PageHeader title="Profile & settings" description="Your account, privacy, and security preferences." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="devices">Devices & activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold">Personal information</h3>
              <div className="space-y-4">
                <div><Label>Full name</Label><Input defaultValue={session?.name ?? mockUser.name} /></div>
                <div><Label>Email</Label><Input defaultValue={session?.email ?? mockUser.email} /></div>
                <Button size="sm" onClick={() => toast("success", "Profile updated")}>Save changes</Button>
              </div>
            </Card>
            <SettingsCard title="Insurance & wallet">
              <InfoRow label="Plan" value={<Badge variant="violet">{mockPolicy.planName}</Badge>} />
              <InfoRow label="Policy status" value={<Badge variant="success" dot>Active</Badge>} />
              <InfoRow label="Member since" value={formatDate(mockPolicy.startDate)} />
              <InfoRow label="Wallet" value={shortAddress(mockUser.wallet)} mono />
              <InfoRow label="Commitment" value={`${mockPolicy.commitmentHash.slice(0, 14)}…`} mono />
            </SettingsCard>
          </div>
        </TabsContent>

        <TabsContent value="privacy">
          <SettingsCard title="Privacy preferences">
            <ToggleRow label="Shield transaction amounts" description="Hide amounts in your own activity view" defaultOn />
            <ToggleRow label="Anonymous pool statistics" description="Contribute only to aggregate, k-anonymous stats" defaultOn />
            <ToggleRow label="Selective disclosure" description="Allow regulator-scoped proofs when legally required" />
            <ToggleRow label="Research opt-in" description="Share zero-knowledge aggregate health trends" />
          </SettingsCard>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold">Change password</h3>
              <div className="space-y-4">
                <div><Label>Current password</Label><Input type="password" /></div>
                <div><Label>New password</Label><Input type="password" /></div>
                <Button size="sm" onClick={() => toast("success", "Password changed")}>Update password</Button>
              </div>
            </Card>
            <SettingsCard title="Account security">
              <ToggleRow label="Two-factor authentication" description="TOTP app-based MFA" defaultOn />
              <ToggleRow label="Wallet co-signing" description="Require wallet signature for withdrawals" defaultOn />
              <ToggleRow label="Login alerts" description="Email on new device sign-in" defaultOn />
            </SettingsCard>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <SettingsCard title="Notification preferences">
            <ToggleRow label="Claim updates" description="Proof verification and payout status" defaultOn />
            <ToggleRow label="Premium reminders" description="3 days before each due date" defaultOn />
            <ToggleRow label="Yield distributions" description="Monthly yield credited to your share" defaultOn />
            <ToggleRow label="Governance & product news" />
          </SettingsCard>
        </TabsContent>

        <TabsContent value="devices">
          <div className="grid gap-6 lg:grid-cols-2">
            <SettingsCard title="Connected devices">
              <InfoRow label={"Windows · Chrome"} value={<span className="flex items-center gap-2 text-sm"><Laptop className="h-4 w-4 text-cyan" /> This device</span>} />
              <InfoRow label={"Android · App"} value={<span className="flex items-center gap-2 text-sm text-muted"><Smartphone className="h-4 w-4" /> 2d ago</span>} />
            </SettingsCard>
            <SettingsCard title="Recent activity">
              <InfoRow label="Sign-in" value="Today · 09:14" />
              <InfoRow label="Claim submitted" value="Jul 16 · 08:45" />
              <InfoRow label="Premium paid" value="Jul 1 · 07:30" />
            </SettingsCard>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
