"use client";

import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { RequireRole } from "@/lib/auth";
import {
  FileText,
  LayoutDashboard,
  Landmark,
  ShoppingBag,
  User,
  Wallet,
} from "lucide-react";

const nav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Buy insurance", href: "/dashboard/buy", icon: ShoppingBag },
  { label: "Claims", href: "/dashboard/claims", icon: FileText },
  { label: "Treasury", href: "/dashboard/treasury", icon: Landmark },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="user">
      <DashboardShell
        role="user"
        nav={nav}
        portalLabel="Private member portal"
        notificationsHref="/dashboard/notifications"
        unread={2}
      >
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
