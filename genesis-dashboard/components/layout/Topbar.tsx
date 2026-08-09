'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Menu, Search } from 'lucide-react';

export function Topbar() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '...';

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '--:--';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-sidebar-border bg-background/80 px-6 backdrop-blur-md">
      {/* Mobile Menu & Global Search */}
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 -ml-2 text-text-secondary hover:text-foreground">
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-card-border bg-card-bg text-sm text-text-muted w-64 hover:border-card-border-hover transition-colors">
          <Search className="h-4 w-4" />
          <span className="flex-1">Search agents...</span>
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-card-border bg-background px-1.5 font-mono text-[10px] font-medium text-text-muted">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Date & Time */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg border border-card-border bg-card-bg shadow-sm">
          <div className="flex items-center gap-2 text-xs text-text-primary">
            <Calendar className="w-3.5 h-3.5 text-text-secondary" />
            <span>{formattedDate}</span>
          </div>
          <div className="w-px h-3 bg-card-border" />
          <span className="text-xs text-text-primary font-mono">{formattedTime}</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg border border-transparent hover:bg-card-bg transition-colors text-text-secondary hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </button>
      </div>
    </header>
  );
}
