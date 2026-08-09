"use client";

import { Logo } from "@/components/shared/logo";
import { WalletBadge } from "@/components/shared/wallet-badge";
import { useAuth, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

export function DashboardShell({
  role,
  nav,
  portalLabel,
  wallet,
  notificationsHref,
  unread = 0,
  children,
}: {
  role: Role;
  nav: NavItem[];
  portalLabel: string;
  wallet?: string;
  notificationsHref: string;
  unread?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { session, logout } = useAuth();
  const [open, setOpen] = React.useState(false);

  const roleHome = { user: "/dashboard", hospital: "/hospital", admin: "/admin" }[role];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <Logo href={roleHome} />
        <button className="lg:hidden text-subtle" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-1 px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
        {portalLabel}
      </p>
      <nav className="mt-6 flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active =
            item.href === roleHome ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-gradient-to-r from-cyan/15 to-violet/10 text-white border border-cyan/20"
                  : "text-subtle hover:bg-white/5 hover:text-white border border-transparent"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5", active && "text-cyan")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/8 p-4">
        <div className="mb-3 flex items-center gap-3 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan/30 to-violet/30 text-sm font-semibold">
            {session?.name?.[0]?.toUpperCase() ?? "U"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{session?.name}</p>
            <p className="truncate text-xs text-subtle">{session?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-subtle transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/8 bg-card/60 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/8 bg-[#0b0d12]">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/8 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <button className="lg:hidden text-muted" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {wallet && <span className="hidden sm:block"><WalletBadge address={wallet} /></span>}
            <Link
              href={notificationsHref}
              className="relative rounded-xl p-2 text-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              <Bell className="h-4.5 w-4.5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan text-[9px] font-bold text-black">
                  {unread}
                </span>
              )}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
