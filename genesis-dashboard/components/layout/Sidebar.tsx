'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  TerminalSquare, 
  Activity,
  Bot,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Economy', href: '/economy', icon: Briefcase },
  { name: 'Orchestration', href: '/admin', icon: TerminalSquare },
  { name: 'Activity Log', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar-bg flex flex-col hidden md:flex transition-transform">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold tracking-wide text-foreground">
          GENES<span className="text-primary font-bold">IS</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Platform
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-card-bg hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-text-muted group-hover:text-text-secondary")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile / Status */}
      <div className="border-t border-sidebar-border/50 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card-bg p-3 shadow-sm">
          <div className="relative h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold border border-zinc-700">
            C
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card-bg bg-success" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">codevixards</span>
            <span className="text-xs text-text-muted">System Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
