"use client";

import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { RequireRole } from "@/lib/auth";
import { mockHospital } from "@/lib/mock-data";
import {
  BarChart3,
  Building2,
  FileCheck2,
  LayoutDashboard,
  Receipt,
  Users,
} from "lucide-react";

const nav: NavItem[] = [
  { label: "Overview", href: "/hospital", icon: LayoutDashboard },
  { label: "Claims", href: "/hospital/claims", icon: FileCheck2 },
  { label: "Patients", href: "/hospital/patients", icon: Users },
  { label: "Payouts", href: "/hospital/payouts", icon: Receipt },
  { label: "Analytics", href: "/hospital/analytics", icon: BarChart3 },
  { label: "Hospital profile", href: "/hospital/profile", icon: Building2 },
];

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="hospital">
      <DashboardShell
        role="hospital"
        nav={nav}
        portalLabel="Hospital admin portal"
        wallet={mockHospital.wallet}
        notificationsHref="/hospital/notifications"
        unread={1}
      >
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
