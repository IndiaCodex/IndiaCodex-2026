'use client';

import React from 'react';
import useSWR from 'swr';
import { fetchEvents } from '@/lib/api';
import { Event, Agent } from '@/types/agent';
import { Loader2 } from 'lucide-react';
import { formatDateUTC } from '@/lib/date';

export function Obituary({ agent }: { agent: Agent }) {
  const { data: events, isLoading } = useSWR<Event[]>('/api/events', fetchEvents, {
    refreshInterval: 3000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
      </div>
    );
  }

  const agentEvents = (events || []).filter((e) => e.agentId === agent.id);

  // Calculate Stats
  let cause = 'Unknown anomaly';
  let jobsCompleted = 0;
  let lifetimeEarnings = 0;

  // Sort chronological (oldest to newest) to find the last error or system event that could be a cause
  const sorted = [...agentEvents].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  sorted.forEach(e => {
    if (e.type === 'task_complete') jobsCompleted++;
    if (e.amount) lifetimeEarnings += e.amount;
    if (e.type === 'error' || (e.type === 'system' && e.message.toLowerCase().includes('terminat'))) {
      cause = e.message;
    }
  });

  const born = formatDateUTC(agent.createdAt, { year: 'numeric', month: 'long', day: 'numeric' });
  const died = agent.diedAt ? formatDateUTC(agent.diedAt, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';

  return (
    <div className="flex justify-center items-center py-12">
      <div className="relative font-mono text-zinc-400 bg-zinc-950 p-8 rounded-lg shadow-2xl border border-zinc-800">
        <pre className="leading-tight text-sm sm:text-base text-zinc-500 drop-shadow-md">
{`┌──────────────────────────────┐
│                              │
│          Here lies           │
│                              │
│ ${agent.name.padEnd(28, ' ')} │
│                              │
│ Born: ${born.padEnd(23, ' ')}│
│ Died: ${died.padEnd(23, ' ')}│
│                              │
│ Cause:                       │
│ ${cause.substring(0, 28).padEnd(28, ' ')} │
│                              │
│ Jobs: ${jobsCompleted.toString().padEnd(23, ' ')}│
│ Lifetime Earnings:           │
│ ${lifetimeEarnings.toString()} ADA`.padEnd(31, ' ') + `│
│                              │
└──────────────────────────────┘`}
        </pre>
      </div>
    </div>
  );
}
