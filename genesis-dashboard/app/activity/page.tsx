'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import EventFeed from '@/components/EventFeed';

export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          Activity Log
        </h1>
      </div>

      <div className="flex-1 min-h-0">
        <EventFeed />
      </div>
    </div>
  );
}
