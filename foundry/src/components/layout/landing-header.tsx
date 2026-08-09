"use client";

import Link from "next/link";
import { Hexagon } from "lucide-react";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-[var(--shadow-input)] transition-transform duration-200 group-hover:scale-[1.03]">
            <Hexagon className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display text-sm font-semibold text-foreground">{siteConfig.name}</span>
            <p className="text-[10px] leading-none text-foreground-dim">Autonomous OS</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground-muted md:flex">
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <Link href="/projects" className="transition-colors hover:text-foreground">
            Projects
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="segmented" />
          <Link
            href="/projects/new"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
          >
            Create company
          </Link>
        </div>
      </div>
    </header>
  );
}