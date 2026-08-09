"use client";

import { useUIStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PanelRightOpen, PanelRightClose } from "lucide-react";

export function Header() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-6 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="text-foreground-dim hover:bg-surface-hover hover:text-foreground"
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? (
          <PanelRightClose className="h-4 w-4" />
        ) : (
          <PanelRightOpen className="h-4 w-4" />
        )}
      </Button>
      <div className="flex-1" />
      <ThemeToggle />
      <WalletConnect />
    </header>
  );
}