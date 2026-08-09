'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';
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
import { fetchEvents } from '@/lib/api';
import { cn } from '@/lib/utils';

import { Event } from '@/types/agent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const EVENT_FLASH_DURATION_MS = 1600;

const getEventStyles = (type: Event['type']) => {
  switch (type) {
    case 'spawn':
      return { icon: <PlusCircle className="h-4 w-4 text-info" />, bg: 'bg-info/10', border: 'border-info/20' };
    case 'task_start':
      return { icon: <Activity className="h-4 w-4 text-primary" />, bg: 'bg-primary/10', border: 'border-primary/20' };
    case 'task_complete':
      return { icon: <CheckCircle2 className="h-4 w-4 text-success" />, bg: 'bg-success/10', border: 'border-success/20' };
    case 'error':
      return { icon: <AlertTriangle className="h-4 w-4 text-error" />, bg: 'bg-error/10', border: 'border-error/20' };
    case 'tick':
      return { icon: <Terminal className="h-4 w-4 text-text-muted" />, bg: 'bg-sidebar-border', border: 'border-card-border' };
    case 'system':
      return { icon: <Settings className="h-4 w-4 text-text-secondary" />, bg: 'bg-sidebar-border', border: 'border-card-border' };
    default:
      return { icon: <Info className="h-4 w-4 text-text-secondary" />, bg: 'bg-sidebar-border', border: 'border-card-border' };
  }
};

export default function EventFeed() {
  const { data: events, error, isLoading } = useSWR<Event[]>('backend:events', fetchEvents, {
    refreshInterval: 3000,
  });
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(() => new Set());
  const previousIdsRef = useRef<Set<string> | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const sortedEvents = [...(events ?? [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  useEffect(() => {
    const currentEvents = [...(events ?? [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const currentIds = new Set(currentEvents.map((event) => event.id));

    if (previousIdsRef.current === null) {
      previousIdsRef.current = currentIds;
      return;
    }

    const newIds = currentEvents
      .map((event) => event.id)
      .filter((id) => !previousIdsRef.current?.has(id));

    previousIdsRef.current = currentIds;

    if (newIds.length === 0) {
      return;
    }

    setHighlightedIds((prev) => {
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });

    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }

    flashTimerRef.current = window.setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        currentEvents.forEach((event) => next.delete(event.id));
        return next;
      });
      flashTimerRef.current = null;
    }, EVENT_FLASH_DURATION_MS);
  }, [events]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-card-border/50 sticky top-0 bg-card-bg/95 backdrop-blur z-10">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Live Activity
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-text-secondary">Syncing</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {isLoading && !events && (
          <div className="flex h-full items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}

        {error && (
          <div className="m-4 rounded-lg border border-error/20 bg-error/10 p-4 text-center text-sm text-error">
            Connection lost. Unable to load activity feed.
          </div>
        )}

        {!isLoading && events?.length === 0 && (
          <div className="p-10 text-center text-text-muted flex flex-col items-center">
            <Info className="mb-2 h-6 w-6 opacity-50" />
            <p className="text-sm">No activity recorded yet</p>
          </div>
        )}

        <div className="divide-y divide-card-border/50">
          {sortedEvents.map((event) => {
            const isHighlighted = highlightedIds.has(event.id);
            const style = getEventStyles(event.type);

            return (
              <div
                key={event.id}
                className={cn(
                  'group relative flex items-start gap-3 p-4 transition-all duration-500 ease-out hover:bg-sidebar-border/30',
                  isHighlighted && 'bg-primary/5'
                )}
              >
                {isHighlighted && (
                  <span
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent animate-event-flash"
                    aria-hidden="true"
                  />
                )}

                <div className={cn("mt-0.5 flex-shrink-0 rounded-md border p-1.5 shadow-sm", style.bg, style.border)}>
                  {style.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{event.agentId}</span>
                      {event.amount !== undefined && (
                        <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
                          <Coins className="h-3 w-3 mr-1" />
                          {event.amount} ADA
                        </Badge>
                      )}
                    </div>
                    <span className="flex-shrink-0 whitespace-nowrap text-xs text-text-muted">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-text-secondary">{event.message}</p>

                  {event.txHash && (
                    <a
                      href={`https://preprod.cardanoscan.io/transaction/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-primary/80 transition-colors hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Transaction
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

