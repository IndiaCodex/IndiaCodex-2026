"use client";

import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { RequireRole } from "@/lib/auth";
import {
  Banknote,
  Building2,
  FileCheck2,
  LayoutDashboard,
  Landmark,
  ScrollText,
  Settings,
  ShieldAlert,
  UserCog,
  Users,
} from "lucide-react";

const nav: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Treasury", href: "/admin/treasury", icon: Landmark },
  { label: "Loans", href: "/admin/loans", icon: Banknote },
  { label: "Claim approvals", href: "/admin/claims", icon: FileCheck2 },
  { label: "Fraud monitor", href: "/admin/fraud", icon: ShieldAlert },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Hospitals", href: "/admin/hospitals", icon: Building2 },
  { label: "Audit logs", href: "/admin/audit", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "My profile", href: "/admin/profile", icon: UserCog },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <DashboardShell
        role="admin"
        nav={nav}
        portalLabel="Platform administration"
        notificationsHref="/admin/notifications"
        unread={3}
      >
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
