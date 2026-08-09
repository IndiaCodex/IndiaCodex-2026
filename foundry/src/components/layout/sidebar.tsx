"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { useUIStore } from "@/store/ui-store";
import {
  LayoutDashboard,
  FolderKanban,
  Store,
  Settings,
  Hexagon,
  ChevronLeft,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  FolderKanban,
  Store,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 240, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar shadow-[var(--shadow-card)]"
        >
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-[var(--shadow-input)] transition-transform duration-200 group-hover:scale-[1.03]">
                <Hexagon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-sm font-semibold text-foreground">{siteConfig.name}</span>
                <p className="text-[10px] leading-none text-foreground-dim">Autonomous OS</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="btn-icon btn-icon--sm"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            {siteConfig.nav.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-foreground-dim hover:bg-sidebar-hover hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 rounded-xl bg-sidebar-active"
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-dot"
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border px-4 py-4">
            <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-input)]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 h-full w-full animate-ping rounded-full bg-success/40" />
                  <span className="relative h-2 w-2 rounded-full bg-success" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">Cardano Preprod</p>
                  <p className="text-[10px] text-foreground-dim">Testnet — Connected</p>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}