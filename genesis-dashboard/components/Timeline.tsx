'use client';

import React from 'react';
import useSWR from 'swr';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Coins,
  ExternalLink,
  Info,
  PlusCircle,
  Settings,
  Terminal,
} from 'lucide-react';
import { Event } from '@/types/agent';
import { fetchEvents } from '@/lib/api';

const getEventIcon = (type: Event['type']) => {
  switch (type) {
    case 'spawn':
      return <PlusCircle className="h-5 w-5 text-blue-500" />;
    case 'task_start':
      return <Activity className="h-5 w-5 text-purple-500" />;
    case 'task_complete':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'tick':
      return <Terminal className="h-5 w-5 text-zinc-500" />;
    case 'system':
      return <Settings className="h-5 w-5 text-zinc-500" />;
    default:
      return <Info className="h-5 w-5 text-zinc-500" />;
  }
};

export function Timeline({ agentId }: { agentId: string }) {
  const { data: events, error, isLoading } = useSWR<Event[]>('/api/events', fetchEvents, {
    refreshInterval: 3000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-red-500">
        Failed to load timeline events.
      </div>
    );
  }

  // Filter events for this agent and sort newest first
  const agentEvents = (events || [])
    .filter((e) => e.agentId === agentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (agentEvents.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <Info className="mx-auto mb-2 h-8 w-8 opacity-50 text-zinc-600" />
        <p>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
      {agentEvents.map((event) => (
        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Timeline Node */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-zinc-950 bg-zinc-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-zinc-950 z-10 transition-transform hover:scale-110">
            {getEventIcon(event.type)}
          </div>
          
          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm shadow-md transition-all hover:bg-zinc-800/60 hover:border-zinc-700/60">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                </span>
                <span className="text-xs text-zinc-600 font-mono">
                  {format(new Date(event.timestamp), 'HH:mm:ss')}
                </span>
              </div>
              
              <p className="text-sm text-zinc-300 leading-relaxed">
                {event.message}
              </p>
              
              {(event.amount !== undefined || event.txHash) && (
                <div className="flex flex-wrap items-center gap-3 pt-2 mt-2 border-t border-zinc-800/50">
                  {event.amount !== undefined && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-400">
                      <Coins className="h-3.5 w-3.5" />
                      +{event.amount} ADA
                    </span>
                  )}
                  {event.txHash && (
                    <a
                      href={`https://preprod.cardanoscan.io/transaction/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {event.txHash.slice(0, 8)}...{event.txHash.slice(-8)}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
